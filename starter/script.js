'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;

if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
      //"map" 對應到html中，id = "map"
      // 創建 Leaflet 地圖，並將視圖設定為使用者的座標
      const coords = [latitude, longitude];
      map = L.map('map').setView(coords, 22);

      // 加入 OpenStreetMap 圖層
      L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // 在使用者的位置上加一個標記
      map.on('click', function (mapE) {
        mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
      });
    },

    function () {
      alert('Could not get your position');
    }
  );

//toggle cadence unit when type changed
inputType.addEventListener('change', function () {
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  // clean form inputValue
  inputCadence.vale =
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
      '';

  // display marker
  console.log(mapEvent);
  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
    )
    .setPopupContent('Workout')
    .openPopup();
});
