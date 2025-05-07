// Set Cesium ion access token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmOTAxYjQ5Ni02ZjY5LTQ2MjUtOWI4Yi05YzYyYjUzMTIyYTciLCJpZCI6MjY5NzM5LCJpYXQiOjE3Mzk1MzQ2Mzh9.aX-0EVfL80pqJpAsfrnK4KntBoV3syqvOki0j3-i9jw';

// Initialize Cesium viewer
const viewer = new Cesium.Viewer("cesiumContainer");

// 设置初始视角
viewer.scene.globe.enableLighting = false;
viewer.scene.globe.baseColor = Cesium.Color.WHITE;

// Set initial camera position
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
    orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0.0
    }
});

// Fix container sizing
const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        viewer.canvas.width = width;
        viewer.canvas.height = height;
        viewer.camera.setView({
            destination: viewer.camera.position,
            orientation: viewer.camera.headingPitchRoll
        });
    }
});

resizeObserver.observe(document.getElementById('cesiumContainer'));

// Store cities data
let cities = [];
let currentCityIndex = -1;

// DOM elements
const cityInput = document.getElementById('cityInput');
const transportMode = document.getElementById('transportMode');
const addCityButton = document.getElementById('addCity');
const cityList = document.getElementById('cityList');
const citiesCount = document.getElementById('citiesCount');
const totalDistance = document.getElementById('totalDistance');
const countriesCount = document.getElementById('countriesCount');
const modal = document.getElementById('mediaModal');
const closeModal = document.querySelector('.close');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const photoInput = document.getElementById('photoInput');
const uploadPhotoButton = document.getElementById('uploadPhoto');
const photoGallery = document.getElementById('photoGallery');
const blogContent = document.getElementById('blogContent');
const saveBlogButton = document.getElementById('saveBlog');

// Function to geocode city name to coordinates
async function geocodeCity(cityName) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                country: data[0].display_name.split(',').pop().trim()
            };
        }
        throw new Error('找不到该城市，请重试。');
    } catch (error) {
        console.error('Geocoding error:', error);
        alert('找不到该城市，请重试。');
        return null;
    }
}

// Function to create CZML for a city
function createCityCzml(city, index) {
    const czml = [
        {
            id: "document",
            name: "Travel Tracker",
            version: "1.0"
        },
        {
            id: `city_${index}`,
            name: city.name,
            position: {
                cartographicDegrees: [city.coordinates.lon, city.coordinates.lat, 0]
            },
            point: {
                pixelSize: 10,
                color: {
                    rgba: [255, 0, 0, 255]
                },
                outlineColor: {
                    rgba: [255, 255, 255, 255]
                },
                outlineWidth: 2
            },
            label: {
                text: city.name,
                font: "14px sans-serif",
                fillColor: {
                    rgba: [255, 255, 255, 255]
                },
                style: "FILL_AND_OUTLINE",
                outlineWidth: 2,
                verticalOrigin: "BOTTOM",
                pixelOffset: {
                    cartesian2: [0, -10]
                }
            }
        }
    ];

    // Add photos as rectangles around the city point
    city.photos.forEach((photo, photoIndex) => {
        const lat = city.coordinates.lat;
        const lon = city.coordinates.lon;
        const size = 0.05; // 调整照片大小
        const radius = 0.1; // 照片到城市点的距离
        const angle = (photoIndex * (2 * Math.PI / city.photos.length)) + (Math.PI / 4); // 均匀分布，偏移45度

        // 计算照片中心点位置
        const photoLon = lon + radius * Math.cos(angle);
        const photoLat = lat + radius * Math.sin(angle);

        czml.push({
            id: `photo_${index}_${photoIndex}`,
            name: `${city.name} Photo ${photoIndex + 1}`,
            rectangle: {
                coordinates: {
                    wsenDegrees: [
                        photoLon - size,
                        photoLat - size,
                        photoLon + size,
                        photoLat + size
                    ]
                },
                height: 0,
                fill: true,
                material: {
                    image: {
                        image: photo,
                        color: {
                            rgba: [255, 255, 255, 255]
                        }
                    }
                },
                outline: true,
                outlineColor: {
                    rgba: [255, 255, 255, 200]
                },
                outlineWidth: 2,
                // 添加圆角效果
                cornerType: "ROUNDED",
                cornerRadius: 0.2, // 圆角半径（相对于矩形大小的比例）
                // 添加阴影效果
                shadows: "ENABLED",
                // 添加半透明效果
                translucencyByDistance: {
                    near: 0,
                    nearValue: 1.0,
                    far: 10000000,
                    farValue: 0.5
                }
            }
        });

        // 添加连接线
        czml.push({
            id: `line_${index}_${photoIndex}`,
            name: `Line to Photo ${photoIndex + 1}`,
            polyline: {
                positions: {
                    cartographicDegrees: [
                        lon, lat, 0,
                        photoLon, photoLat, 0
                    ]
                },
                width: 1,
                material: {
                    polylineDash: {
                        color: {
                            rgba: [255, 255, 255, 100]
                        },
                        dashLength: 8.0
                    }
                }
            }
        });
    });

    return czml;
}

// Function to update the map with cities and routes
function updateMap(shouldFlyToLast = false) {
    // Remove existing data sources
    viewer.dataSources.removeAll();

    // Create CZML for all cities
    let allCzml = [
        {
            id: "document",
            name: "Travel Tracker",
            version: "1.0"
        }
    ];

    // Add cities and their photos
    cities.forEach((city, index) => {
        const cityCzml = createCityCzml(city, index);
        allCzml = allCzml.concat(cityCzml.slice(1)); // Skip document header
    });

    // Add routes between cities
    for (let i = 1; i < cities.length; i++) {
        const prevCity = cities[i - 1];
        const currCity = cities[i];
        
        allCzml.push({
            id: `route_${i}`,
            name: `Route ${i}`,
            polyline: {
                positions: {
                    cartographicDegrees: [
                        prevCity.coordinates.lon,
                        prevCity.coordinates.lat,
                        0,
                        currCity.coordinates.lon,
                        currCity.coordinates.lat,
                        0
                    ]
                },
                width: 2,
                material: {
                    polylineArrow: {
                        color: {
                            rgba: [255, 255, 0, 255]
                        }
                    }
                }
            }
        });
    }

    // Load CZML data
    const dataSourcePromise = Cesium.CzmlDataSource.load(allCzml);
    viewer.dataSources.add(dataSourcePromise);

    // 只在添加新城市时飞行到最后一个城市
    if (shouldFlyToLast && cities.length > 0) {
        const lastCity = cities[cities.length - 1];
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                lastCity.coordinates.lon,
                lastCity.coordinates.lat,
                10000
            ),
            duration: 2
        });
    }
}

// Function to add a city to the map
async function addCity() {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const location = await geocodeCity(cityName);
    if (!location) return;

    const city = {
        name: cityName,
        transportMode: transportMode.value,
        coordinates: location,
        country: location.country,
        photos: [],
        blog: ''
    };

    cities.push(city);
    updateMap(true); // 添加新城市时飞行
    updateCityList();
    updateStats();
    cityInput.value = '';
    
    // 自动选择新添加的城市
    selectCity(cities.length - 1);
}

// Function to update the city list in the UI
function updateCityList() {
    cityList.innerHTML = '';
    cities.forEach((city, index) => {
        const cityElement = document.createElement('div');
        cityElement.className = 'city-item';
        cityElement.innerHTML = `
            <span>${city.name} (${city.transportMode})</span>
            <div>
                <button onclick="selectCity(${index})">查看</button>
                <button onclick="removeCity(${index})">删除</button>
            </div>
        `;
        cityList.appendChild(cityElement);
    });
}

// Function to select a city
function selectCity(index) {
    currentCityIndex = index;
    const city = cities[index];
    
    // 更新博客内容
    blogContent.value = city.blog;
    
    // 高亮选中的城市
    const cityItems = document.querySelectorAll('.city-item');
    cityItems.forEach((item, i) => {
        item.style.backgroundColor = i === index ? '#e8f5e9' : '';
    });

    // 计算合适的相机高度和视角
    const radius = 0.1; // 与照片分布半径相同
    const height = 15000; // 相机高度（米）

    // 飞行到选中的城市，确保照片在视野内
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            city.coordinates.lon,
            city.coordinates.lat,
            height
        ),
        orientation: {
            heading: 0.0,
            pitch: -Cesium.Math.PI_OVER_TWO, // 正上方俯视
            roll: 0.0
        },
        duration: 2,
        complete: function() {
            // 确保所有照片都在视野内
            if (city.photos.length > 0) {
                const boundingSphere = new Cesium.BoundingSphere(
                    Cesium.Cartesian3.fromDegrees(city.coordinates.lon, city.coordinates.lat, 0),
                    radius * 111000 // 将度数转换为米（粗略计算）
                );
                viewer.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
                viewer.scene.camera.constrainedAxis = Cesium.Cartesian3.UNIT_Z;
                viewer.scene.camera.lookAt(
                    boundingSphere.center,
                    new Cesium.HeadingPitchRange(
                        0.0,
                        -Cesium.Math.PI_OVER_TWO,
                        boundingSphere.radius * 2.0
                    )
                );
            }
        }
    });
}

// Function to update statistics
function updateStats() {
    citiesCount.textContent = cities.length;
    
    // Calculate total distance
    let distance = 0;
    for (let i = 1; i < cities.length; i++) {
        const prev = cities[i - 1];
        const curr = cities[i];
        distance += Cesium.Cartesian3.distance(
            Cesium.Cartesian3.fromDegrees(prev.coordinates.lon, prev.coordinates.lat),
            Cesium.Cartesian3.fromDegrees(curr.coordinates.lon, curr.coordinates.lat)
        ) / 1000; // Convert to kilometers
    }
    totalDistance.textContent = `${Math.round(distance)} km`;

    // Count unique countries
    const countries = new Set(cities.map(city => city.country));
    countriesCount.textContent = countries.size;
}

// Function to remove a city
function removeCity(index) {
    cities.splice(index, 1);
    updateMap();
    updateCityList();
    updateStats();
    
    // 如果删除的是当前选中的城市，清空博客内容
    if (index === currentCityIndex) {
        currentCityIndex = -1;
        blogContent.value = '';
    }
}

// Function to handle photo upload
function handlePhotoUpload() {
    const files = photoInput.files;
    if (files.length === 0 || currentCityIndex === -1) return;

    const city = cities[currentCityIndex];
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            city.photos.push(e.target.result);
            updateMap(false); // 更新照片时不飞行
        };
        reader.readAsDataURL(file);
    });
}

// Function to save blog
function saveBlog() {
    if (currentCityIndex === -1) return;
    cities[currentCityIndex].blog = blogContent.value;
}

// Event listeners
addCityButton.addEventListener('click', addCity);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addCity();
    }
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`${tab}Tab`).classList.add('active');
    });
});

uploadPhotoButton.addEventListener('click', handlePhotoUpload);
saveBlogButton.addEventListener('click', saveBlog);

// 轨迹浏览相关变量
let isTouring = false;
let currentTourIndex = 0;

// 轨迹浏览函数
function toggleTour() {
    if (cities.length < 2) {
        alert('至少需要两个城市才能开始轨迹浏览');
        return;
    }

    isTouring = !isTouring;
    const tourButton = document.getElementById('tourButton');
    
    if (isTouring) {
        tourButton.textContent = '停止浏览';
        tourButton.style.backgroundColor = '#f44336';
        currentTourIndex = 0;
        tourToNextCity();
    } else {
        tourButton.textContent = '轨迹浏览';
        tourButton.style.backgroundColor = '#4CAF50';
        if (viewer.clock) {
            viewer.clock.shouldAnimate = false;
        }
    }
}

// 浏览到下一个城市
function tourToNextCity() {
    if (!isTouring) return;

    // 如果已经到达最后一个城市，停止浏览
    if (currentTourIndex >= cities.length - 1) {
        isTouring = false;
        const tourButton = document.getElementById('tourButton');
        tourButton.textContent = '轨迹浏览';
        tourButton.style.backgroundColor = '#4CAF50';
        return;
    }

    const currentCity = cities[currentTourIndex];
    const nextCity = cities[currentTourIndex + 1];

    // 计算飞行时间（基于距离）
    const start = Cesium.Cartesian3.fromDegrees(
        currentCity.coordinates.lon,
        currentCity.coordinates.lat,
        15000
    );
    const end = Cesium.Cartesian3.fromDegrees(
        nextCity.coordinates.lon,
        nextCity.coordinates.lat,
        15000
    );
    const distance = Cesium.Cartesian3.distance(start, end);
    const duration = Math.min(Math.max(distance / 1000, 2), 10); // 2-10秒之间

    // 飞行到下一个城市
    viewer.camera.flyTo({
        destination: end,
        orientation: {
            heading: 0.0,
            pitch: -Cesium.Math.PI_OVER_TWO,
            roll: 0.0
        },
        duration: duration,
        complete: function() {
            if (isTouring) {
                // 在城市停留1秒
                setTimeout(() => {
                    if (isTouring) {
                        currentTourIndex++;
                        tourToNextCity();
                    }
                }, 1000);
            }
        }
    });
}

// 添加事件监听器
document.getElementById('tourButton').addEventListener('click', toggleTour); 