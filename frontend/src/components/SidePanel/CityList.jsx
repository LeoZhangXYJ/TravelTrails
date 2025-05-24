import React, { useState, useEffect } from 'react';
import { useTravelContext } from '../../context/TravelContext';
import { DatePicker, Input, Select, Button, Form, Space, Alert, Radio } from 'antd';
// import './SidePanel.css'; // Entfernt, da die Datei nicht existiert und CSS global sein sollte

const { RangePicker } = DatePicker;
const { Option } = Select;

// Wiederhergestellte und angepasste geocodeCity Funktion
async function geocodeCity(cityName, countryName = '') {
  try {
    let query = cityName;
    if (countryName) {
      query += `, ${countryName}`;
    }
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        // Versuche, das Land genauer zu extrahieren, falls vorhanden
        country: data[0].address?.country || data[0].display_name.split(',').pop().trim()
      };
    }
    return null; // Kein Fehler, aber auch kein Ergebnis
  } catch (error) {
    console.error('Geo-Kodierungsfehler:', error);
    // Hier keinen Alert, Fehlerbehandlung erfolgt im handleSubmit
    return null;
  }
}

const CityList = () => {
  const { addCity, cities, checkDateConflict, getDisabledDates } = useTravelContext();
  const [form] = Form.useForm();
  const [geocodingError, setGeocodingError] = useState(null);
  const [inputType, setInputType] = useState('city'); // 'city' oder 'coordinates'
  const [isFirstCity, setIsFirstCity] = useState(true); // Zustand für den ersten Ort

  useEffect(() => {
    setIsFirstCity(cities.length === 0);
    // Wenn es nicht mehr die erste Stadt ist und die Felder gesperrt waren, Formular-Initialwerte anpassen
    if (cities.length > 0 && isFirstCity) {
        form.setFieldsValue({
            transportMode: 'plane', // Standard-Transportmittel für nachfolgende Städte
            // dateRange könnte hier auch initialisiert werden, falls gewünscht
        });
    }
  }, [cities, form, isFirstCity]);

  const handleInputTypeChange = (e) => {
    setInputType(e.target.value);
    setGeocodingError(null); // Fehler zurücksetzen beim Wechsel
    // Formularfelder zurücksetzen, um Validierungsfehler aus anderen Modi zu vermeiden
    form.resetFields(['cityName', 'countryName', 'latitude', 'longitude']);
  };

  const handleSubmit = async (values) => {
    setGeocodingError(null);
    let coordinates = null;
    let determinedCountry = values.countryName || '';
    let determinedCityName = values.cityName || '';

    if (inputType === 'coordinates') {
      if (values.latitude && values.longitude) {
        coordinates = {
          lat: parseFloat(values.latitude),
          lon: parseFloat(values.longitude),
        };
        if (!determinedCityName) {
            determinedCityName = isFirstCity ? "家" : "自定义位置";
        }
        // Land bleibt wie eingegeben oder leer, da wir keine Rückwärts-Geokodierung machen
      } else {
        // Validierung sollte dies bereits abfangen
        setGeocodingError('请输入有效的经度和纬度。');
        return;
      }
    } else { // inputType === 'city'
      if (values.cityName) {
        determinedCityName = values.cityName; // Stadtname direkt übernehmen
        const geoData = await geocodeCity(values.cityName, values.countryName);
        if (geoData) {
          coordinates = { lat: geoData.lat, lon: geoData.lon };
          if (!determinedCountry && geoData.country) {
            determinedCountry = geoData.country;
            form.setFieldsValue({ countryName: geoData.country });
          }
        } else {
          setGeocodingError(`无法找到城市 "${values.cityName}" 的经纬度。请检查城市名称或切换到经纬度输入。`);
          return;
        }
      } else {
        // Validierung sollte dies bereits abfangen
        setGeocodingError('请输入城市名称。');
        return;
      }
    }

    if (!coordinates) {
      setGeocodingError('未能确定城市坐标，请检查输入。');
      return;
    }

    // 检查日期冲突（仅对非首城进行检查）
    if (!isFirstCity && values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      const conflictResult = checkDateConflict(
        values.dateRange[0].toISOString(),
        values.dateRange[1].toISOString()
      );

      if (conflictResult && conflictResult.conflict) {
        setGeocodingError(
          `选择的日期与 "${conflictResult.conflictCity}" 的旅行时间冲突！` +
          `冲突日期：${conflictResult.conflictStart.toLocaleDateString()} - ${conflictResult.conflictEnd.toLocaleDateString()}`
        );
        return;
      }
    }

    const cityData = {
      name: determinedCityName,
      country: determinedCountry,
      coordinates: coordinates,
      transportMode: isFirstCity ? 'home' : values.transportMode,
      startDate: isFirstCity ? null : (values.dateRange && values.dateRange[0] ? values.dateRange[0].toISOString() : null),
      endDate: isFirstCity ? null : (values.dateRange && values.dateRange[1] ? values.dateRange[1].toISOString() : null),
      blog: ''
    };

    try {
      addCity(cityData);
      form.resetFields();
      // Nach dem Hinzufügen der ersten Stadt, setze isFirstCity auf false für den nächsten Aufruf,
      // falls die Komponente nicht durch useEffect schon aktualisiert wurde.
      if (isFirstCity) {
        setIsFirstCity(false);
        // Setze Standardwerte für die nächste Stadt, falls die erste gerade hinzugefügt wurde
        form.setFieldsValue({
            transportMode: 'plane',
            // cityName: '' // cityName wird durch resetFields geleert
        });
      }
    } catch (error) {
      alert(`添加城市操作失败: ${error.message}`);
      console.error("Failed to add city:", error);
    }
  };

  // Label für Stadt-/Ortsname anpassen
  const cityNameLabel = isFirstCity ? "家/起点名称" : (inputType === 'city' ? "城市名称" : "地点名称 (可选)");
  const cityNamePlaceholder = isFirstCity ? "例如：我的家" : (inputType === 'city' ? "例如：北京" : "例如：某个景点");

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      className="city-form-container"
      // Initialwerte setzen, wenn es die erste Stadt ist
      initialValues={{
        transportMode: isFirstCity ? 'home' : 'plane',
      }}
    >
      {geocodingError && <Alert message={geocodingError} type="error" closable onClose={() => setGeocodingError(null)} style={{ marginBottom: '15px' }}/>}

      <Form.Item label="输入方式">
        <Radio.Group value={inputType} onChange={handleInputTypeChange}>
          <Radio.Button value="city">城市名称</Radio.Button>
          <Radio.Button value="coordinates">经纬度</Radio.Button>
        </Radio.Group>
      </Form.Item>

      {inputType === 'city' && (
        <>
          <Form.Item
            name="cityName"
            label={cityNameLabel}
            rules={[{ required: inputType === 'city' || (inputType === 'coordinates' && isFirstCity), message: `请输入${cityNameLabel}` }]}
          >
            <Input placeholder={cityNamePlaceholder} />
          </Form.Item>

          <Form.Item name="countryName" label="国家名称 (可选, 辅助地理编码)" hidden={isFirstCity && inputType === 'coordinates'}>
            <Input placeholder="例如：中国" />
          </Form.Item>
        </>
      )}

      {inputType === 'coordinates' && (
        <>
          <Form.Item
            name="cityName"
            label={cityNameLabel} // Auch hier das dynamische Label verwenden
             // Für Koordinateneingabe ist cityName immer optional, außer es ist die erste Stadt
            rules={[{ required: isFirstCity, message: `请输入${cityNameLabel}` }]}
          >
            <Input placeholder={cityNamePlaceholder} />
          </Form.Item>
          <Space align="baseline" style={{ display: 'flex' }}>
            <Form.Item
              name="latitude"
              label="纬度"
              rules={[
                { required: inputType === 'coordinates', message: '请输入纬度' },
                {
                  validator: (_, value) => {
                    if (!value && inputType === 'coordinates') {
                      return Promise.reject(new Error('请输入纬度'));
                    }
                    if (value && (isNaN(value) || value < -90 || value > 90)) {
                      return Promise.reject(new Error('请输入有效的纬度(-90.0 到 90.0)'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              style={{ flex: 1 }}
            >
              <Input type="number" step="any" placeholder="例如：39.9053" />
            </Form.Item>
            <Form.Item
              name="longitude"
              label="经度"
              rules={[
                { required: inputType === 'coordinates', message: '请输入经度' },
                {
                  validator: (_, value) => {
                    if (!value && inputType === 'coordinates') {
                      return Promise.reject(new Error('请输入经度'));
                    }
                    if (value && (isNaN(value) || value < -180 || value > 180)) {
                      return Promise.reject(new Error('请输入有效的经度(-180.0 到 180.0)'));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
              style={{ flex: 1 }}
            >
              <Input type="number" step="any" placeholder="例如：116.3915" />
            </Form.Item>
          </Space>
        </>
      )}

      <Form.Item
        name="transportMode"
        label="交通方式"
        rules={[
          {
            required: !isFirstCity,
            message: '请选择交通方式'
          }
        ]}
      >
        <Select disabled={isFirstCity} placeholder={isFirstCity ? "起点无需交通方式" : "请选择交通方式"}>
          {/* Die Option 'home' wird nicht mehr zur Auswahl angezeigt, aber intern verwendet */}
          <Option value="plane">飞机</Option>
          <Option value="train">火车</Option>
          <Option value="car">汽车</Option>
          <Option value="bus">巴士</Option>
          <Option value="boat">轮船/渡轮</Option>
          <Option value="bicycle">自行车</Option>
          <Option value="walk">步行</Option>
          <Option value="other">其他</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="dateRange"
        label="日期范围"
        rules={[
          {
            required: !isFirstCity,
            message: '请选择旅行日期范围'
          }
        ]}
      >
        <RangePicker
          style={{ width: '100%' }}
          disabled={isFirstCity}
          disabledDate={(current) => {
            // 禁用未来日期，只能选择今天及以前
            if (current && current.isAfter(new Date(), 'day')) {
              return true;
            }

            // 禁用已被其他城市占用的日期
            if (!isFirstCity) {
              const disabledDates = getDisabledDates();
              return disabledDates.some(disabledDate =>
                current.isSame(disabledDate, 'day')
              );
            }

            return false;
          }}
          placeholder={['开始日期', '结束日期']}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          {isFirstCity ? "设为起点并添加" : "添加地点到行程"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CityList;
