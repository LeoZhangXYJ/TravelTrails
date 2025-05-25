Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYWU3ZTYxZi05MjNkLTQ0OWQtYWIyZC1lMTk1MTczNTFhNzEiLCJpZCI6Mjg0ODc4LCJpYXQiOjE3NDIxODE2NjB9.cdN4TUUqoi2hduF5Ph6kCTxq9Y0Od4fxv6jKg20AvZU';

//背景图层初始化
async function initializeViewer() {
    try {
        const viewer = new Cesium.Viewer("cesiumContainer", {
            terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        });

        window.viewer = viewer;  // 使 viewer 在全局可访问

        viewer.scene.globe.enableLighting = true; // 启用地形光照
        viewer.shadows = true; // 启用阴影
        viewer.scene.globe.showWaterEffect = true; // 启用水面效果
    } catch (error) {
        console.log(error);
    }
}
initializeViewer();//进行初始化

//背景图层切换
async function switchLayer(layer) {
    var viewer = window.viewer;
    var layers = viewer.imageryLayers;

    //为选中图层赋予“选中”状态，用于选择按钮后的边框高亮
    document.querySelectorAll('.layer-button').forEach(button => {
        button.classList.remove('selected');
    });

    // 为当前选中的按钮添加选中状态
    if (layer === 'BingMapsRoad') {
        document.getElementById('bingroad').classList.add('selected');
    } else if (layer === 'nightEarth') {
        document.getElementById('bingnight').classList.add('selected');
    } else if (layer === 'onlylabel') {
        document.getElementById('onlylabel').classList.add('selected');
    } else if (layer === 'tianditu') {
        document.getElementById('tianditu').classList.add('selected');
    }else if (layer === 'arcgis') {
        document.getElementById('arcgis').classList.add('selected');
    }else if (layer === 'gaode') {
        document.getElementById('gaode').classList.add('selected');     
    }

    var token = '7c94b499835c3a98af5a1be5f6db2540';
    var tdtUrl = 'https://t{s}.tianditu.gov.cn/';
    var subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];

    if (!viewer) {
        console.error("Viewer 未初始化.");
        return;
    }
    //bing道路地图背景
    if (layer === 'BingMapsRoad') {
        layers.removeAll();
        const layer_1 = viewer.imageryLayers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(4),
        );

    } 
    //bing标签地图背景
    else if (layer === 'onlylabel') {
        layers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(2411391),
          );
    }
    //夜间灯光图背景
    else if (layer === 'nightEarth') {
        layers.removeAll();
        const layer_2 = viewer.imageryLayers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(3812),
        );
    }
    //天地图背景
    else if (layer === 'tianditu') {
        layers.removeAll();

        //加入影像
        const img = new Cesium.UrlTemplateImageryProvider({
            url: tdtUrl + 'DataServer?T=img_w&x={x}&y={y}&l={z}&tk=' + token,
            subdomains: subdomains,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 18

        });
        viewer.imageryLayers.addImageryProvider(img);

        //加入国界线
        const boundary = new Cesium.UrlTemplateImageryProvider({
            url: tdtUrl + 'DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=' + token,
            subdomains: subdomains,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 10
        });
        viewer.imageryLayers.addImageryProvider(boundary);

        //加入地形
        var terrainUrls = new Array();
        for (var i = 0; i < subdomains.length; i++) {
            var url = tdtUrl.replace('{s}', subdomains[i]) + 'mapservice/swdx?T=elv_c&tk=' + token;
            terrainUrls.push(url);
        }
        var provider = new Cesium.GeoTerrainProvider({
            urls: terrainUrls
        });
        viewer.terrainProvider = provider;


    }else if (layer === 'gaode') {
        layers.removeAll();
        const gaodeMap = new Cesium.UrlTemplateImageryProvider({
            url:"http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
        });
        viewer.imageryLayers.addImageryProvider(gaodeMap);
    }
    else if (layer === 'arcgis') {
        layers.removeAll();
        const arcgisMap =  new Cesium.WebMapTileServiceImageryProvider({
            url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/WMTS?',
        });  
        viewer.imageryLayers.addImageryProvider(arcgisMap);
    }
}