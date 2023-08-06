'use strict';

// can add below feature
/**
 * Edit workout
 * delete workout
 * delete all workout
 * sort 
 * rebuild running and cyclic object coming from localsorage
 * error msg and confirmation message
 * show all workouts 
 * draw lines and shapes instead of just points
 * Geocode location from coordinaters
 * display wather data for workout time and place
 */
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Display map using leaflet library

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    inputType.addEventListener('change', this._toggleElevationField);

    form.addEventListener('submit', this._newWorkout.bind(this));

    containerWorkouts.addEventListener('click', this._goToMarker.bind(this));
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert('Could not get your location');
      }
    );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // leaftlet function
    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _goToMarker(e) {
    // e.preventDefault();
    if (!this.#map) return;

    const workoutElement = e.target.closest('.workout');

    if (!workoutElement) return;

    const workout = this.#workouts.find(
      ele => ele.id === workoutElement.dataset.id
    );

    this.#map.setView(workout.coord, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // leaftlet function
    // handling clicks on map
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'));
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const validateInput = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    const { lat, lng } = this.#mapEvent.latlng;
    console.log([lat, lng]);
    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    // validate

    // running then Runnng Obj
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validateInput(cadence, distance, duration) ||
        !allPositive(cadence, distance, duration)
      ) {
        return alert('Input is not valid');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // cycling then Cycling Obj
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (
        !validateInput(elevationGain, distance, duration) ||
        !allPositive(distance, duration)
      ) {
        return alert('Input is not valid');
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }
    // Add new workout
    this.#workouts.push(workout);

    // render workout list
    this._renderWorkout(workout);
    // Render marker
    this._renderWorkoutMarker(workout);
    // Hide form
    this._hideForm();

    // store to local sotrage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coord)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 150,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id=${
      workout.id
    }>
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      } </span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

class Workout {
  description;
  distance;
  duration;
  coord; //[lat,lng]
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coord, distance, duration) {
    this.coord = coord;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    console.log(this.type.slice);
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } , ${this.date.getDate()}
      `;
  }
}

class Running extends Workout {
  type = 'running';
  name;
  cadence;
  pace;
  constructor(coord, distance, duration, cadence) {
    super(coord, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  name;
  elevationGain;
  speed;
  constructor(coord, distance, duration, elevationGain) {
    super(coord, distance, duration);
    this.elevationGain = elevationGain;
    this._setDescription();
    this.calcSpeed();
  }

  calcSpeed() {
    //km/hour
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
