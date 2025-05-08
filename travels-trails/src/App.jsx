import React from 'react';
import './App.css';
import { TravelProvider } from './context/TravelContext';
import CesiumMap from './components/Map/CesiumMap';
import CityList from './components/SidePanel/CityList';
import Stats from './components/SidePanel/Stats';
import PhotoGallery from './components/SidePanel/PhotoGallery';
import BlogEditor from './components/SidePanel/BlogEditor';
import CityForm from './components/SidePanel/CityForm';
import TourControls from './components/SidePanel/TourControls';
// 引入其他需要的组件，如 CityList, Stats 等
// import CityList from './components/SidePanel/CityList';

function App() {
  return (
    <TravelProvider>
      <div className="container">
        <CesiumMap />
        <div className="media-container">
          <CityList />
          <CityForm />
          <TourControls />
          <Stats />
          <PhotoGallery />
          <BlogEditor />
          {/* <CityList /> */}
          {/* 其他组件，如统计、照片、博客等 */}
        </div>
      </div>
    </TravelProvider>
  );
}

export default App;