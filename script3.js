function getWeather() {
    const apiKey = 'f559deb0fd1f50aaaef86eee5c08a72f';
    const city = document.getElementById('city').value;

    // Проверка: введено ли название города
    if (!city) {
        alert('Please enter a city');
        return;
    }

    // Формирование URL для получения текущей погоды и прогноза
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    // Запрос на получение данных о текущей погоде
    fetch(currentWeatherUrl)
        .then(response => response.json())
        .then(data => {
            displayWeather(data);
        })
        .catch(error => {
            console.error('Error fetching current weather data:', error);
            alert('Error fetching current weather data. Please try again.');
        });

    // Запрос на получение данных о почасовом прогнозе
    fetch(forecastUrl)
        .then(response => response.json())
        .then(data => {
            displayHourlyForecast(data.list);
        })
        .catch(error => {
            console.error('Error fetching hourly forecast data:', error);
            alert('Error fetching hourly forecast data. Please try again.');
        });
}

// Функция для отображения текущей погоды
function displayWeather(data) {
    const tempDivInfo = document.getElementById('temp-div');
    const weatherInfoDiv = document.getElementById('weather-info');
    const weatherIcon = document.getElementById('weather-icon');
    const hourlyForecastDiv = document.getElementById('hourly-forecast');

    // Очистка предыдущих данных
    weatherInfoDiv.innerHTML = '';
    hourlyForecastDiv.innerHTML = '';
    tempDivInfo.innerHTML = '';

    // Проверка кода ответа от API
    if (data.cod === '404') {
        weatherInfoDiv.innerHTML = `<p>${data.message}</p>`;
    } else {
        // Данные из ответа API
        const cityName = data.name;
        const temperature = Math.round(data.main.temp - 273.15); // Конвертация из Кельвинов в Цельсии
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

        // HTML-контент для температуры и информации о погоде
        const temperatureHTML = `<p>${temperature}°C</p>`;
        const weatherHtml = `<p>${cityName}</p><p>${description}</p>`;

        // Добавление контента на страницу
        tempDivInfo.innerHTML = temperatureHTML;
        weatherInfoDiv.innerHTML = weatherHtml;
        weatherIcon.src = iconUrl;
        weatherIcon.alt = description;

        // Показ иконки погоды
        showImage();
    }
}

// Функция для отображения почасового прогноза
function displayHourlyForecast(hourlyData) {
    const hourlyForecastDiv = document.getElementById('hourly-forecast');

    // Выбор данных для следующих 24 часов (каждые 3 часа)
    const next24Hours = hourlyData.slice(0, 8);

    next24Hours.forEach(item => {
        const dateTime = new Date(item.dt * 1000); // Конвертация времени из UNIX в миллисекунды
        const hour = dateTime.getHours();
        const temperature = Math.round(item.main.temp - 273.15); // Конвертация из Кельвинов в Цельсии
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

        // HTML-контент для одного элемента прогноза
        const hourlyItemHtml = `
            <div class="hourly-item">
                <span>${hour}:00</span>
                <img src="${iconUrl}" alt="Hourly Weather Icon">
                <span>${temperature}°C</span>
            </div>
        `;

        // Добавление элемента в div почасового прогноза
        hourlyForecastDiv.innerHTML += hourlyItemHtml;
    });
}

// Функция для показа изображения иконки погоды
function showImage() {
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.style.display = 'block'; // Показывает иконку погоды после её загрузки
}
