import React, { useState } from 'react';
import { useTravelContext } from '../../context/TravelContext';
import { getRecommendations } from '../../services/aiService';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/auth';

const AIRecommendations = () => {
  const { cities } = useTravelContext();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleGetRecommendations = async () => {
    if (cities.length === 0) {
      setError('请先添加一些城市');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const visitedCities = cities.map(city => ({
        city: city.name,
        country: city.country || '未知'
      }));

      console.log('Visited cities:', visitedCities);

      const data = await getRecommendations(visitedCities);
      setRecommendations(data);
    } catch (err) {
      console.error('Error details:', err);
      setError(err.message || '获取推荐时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-40 bg-white rounded-2xl shadow-lg relative">
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 flex items-center gap-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition"
      >
        <i className="fas fa-sign-out-alt"></i>
        退出
      </button>
      <h2 className="text-xl font-bold mb-4">AI 旅行推荐</h2>
      
      <button
        onClick={handleGetRecommendations}
        disabled={loading || cities.length === 0}
        className={`w-full py-2 px-4 rounded ${
          loading || cities.length === 0
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? '获取推荐中...' : '获取 AI 推荐'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">推荐城市：</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-white rounded shadow">
                <div className="font-medium">
                  {rec.city}, {rec.country}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {rec.reason}
                </div>
                {rec.inferred_preferences && rec.inferred_preferences.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">推断偏好：</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rec.inferred_preferences.map((pref, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations; 