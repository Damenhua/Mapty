'use strict';

// class workout
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this._setDescription();
    this._calcPace();
  }

  _calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this._setDescription();
    this._calcSpeed();
  }

  _calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

////////////////////////////////////////////////////////////////////////
//  Application

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputCadence = document.querySelector('.form__input--cadence');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #workouts = [];
  #mapZoomLevel = 22;
  #mapEvent;
  constructor() {
    // get user position
    this._getPosition();

    // get localStorage data
    this._getLocalStorage();

    // addEventListener
    form.addEventListener('submit', this._newWorkoutData.bind(this));
    inputType.addEventListener('change', this._toggleWorkoutTypeUnit);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(p) {
    const { latitude } = p.coords;
    const { longitude } = p.coords;
    const coords = [latitude, longitude];

    // 加入 OpenStreetMap 圖層
    //"map" 對應到html中，id = "map"

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // 在使用者的位置上加一個標記
    this.#map.on('click', this._showForm.bind(this));

    // 將workouts渲染到畫面, _renderWorkoutMarker
    this.#workouts.forEach(w => {
      this._renderWorkoutMarker(w);
    });
  }

  // 當點擊地圖時，新增標記
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // 隱藏form且清除input
  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // toggle runnging and cycling unit
  _toggleWorkoutTypeUnit() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkoutData(e) {
    e.preventDefault();

    // is input valid?
    const validInputs = (...inputs) =>
      inputs.every(value => Number.isFinite(value));
    const allPositive = (...inputs) => inputs.every(value => value > 0);

    // get form data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let works;

    // running workout
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!!');
      works = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return alert('Inputs have to be positive numbers!!');
      works = new Cycling([lat, lng], distance, duration, elevation);
    }

    // 將資料儲存到 #workouts = []
    this.#workouts.push(works);

    // Render List
    this._renderWorkoutList(works);

    // Render Marker
    this._renderWorkoutMarker(works);

    // Hide form + clear form value
    this._hideForm();

    // Set localStorage
    this._setLocalStorage();
  }

  _renderWorkoutList(w) {
    let html = `
      <li class="workout workout--${w.type}" data-id=${w.id}>
          <h2 class="workout__title">${w.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              w.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${w.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${w.duration}</span>
            <span class="workout__unit">min</span>
          </div>

    `;

    if (w.type === 'running')
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${w.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${w.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
      </li>

    `;

    if (w.type === 'cycling')
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${w.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${w.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
      </li>

    `;
    form.insertAdjacentHTML('afterend', html);
  }

  _renderWorkoutMarker(w) {
    L.marker(w.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${w.type}-popup`,
        })
      )
      .setPopupContent(`${w.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${w.description}`)
      .openPopup();
  }

  _moveToPopup(e) {
    const workoutE1 = e.target.closest('.workout');
    console.log(workoutE1);
    if (!workoutE1) return;

    const workoutId = this.#workouts.find(w => w.id === workoutE1.dataset.id);

    this.#map.setView(workoutId.coords, this.#mapZoomLevel, {
      animation: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(w => {
      this._renderWorkoutList(w);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
