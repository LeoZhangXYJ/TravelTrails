Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYWU3ZTYxZi05MjNkLTQ0OWQtYWIyZC1lMTk1MTczNTFhNzEiLCJpZCI6Mjg0ODc4LCJpYXQiOjE3NDIxODE2NjB9.cdN4TUUqoi2hduF5Ph6kCTxq9Y0Od4fxv6jKg20AvZU';

//����ͼ���ʼ��
async function initializeViewer() {
    try {
        const viewer = new Cesium.Viewer("cesiumContainer", {
            terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(1),
        });

        window.viewer = viewer;  // ʹ viewer ��ȫ�ֿɷ���

        viewer.scene.globe.enableLighting = true; // ���õ��ι���
        viewer.shadows = true; // ������Ӱ
        viewer.scene.globe.showWaterEffect = true; // ����ˮ��Ч��
    } catch (error) {
        console.log(error);
    }
}
initializeViewer();//���г�ʼ��

//����ͼ���л�
async function switchLayer(layer) {
    var viewer = window.viewer;
    var layers = viewer.imageryLayers;

    //Ϊѡ��ͼ�㸳�衰ѡ�С�״̬������ѡ��ť��ı߿����
    document.querySelectorAll('.layer-button').forEach(button => {
        button.classList.remove('selected');
    });

    // Ϊ��ǰѡ�еİ�ť���ѡ��״̬
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
        console.error("Viewer δ��ʼ��.");
        return;
    }
    //bing��·��ͼ����
    if (layer === 'BingMapsRoad') {
        layers.removeAll();
        const layer_1 = viewer.imageryLayers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(4),
        );

    } 
    //bing��ǩ��ͼ����
    else if (layer === 'onlylabel') {
        layers.removeAll();
        const layer = viewer.imageryLayers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(2411391),
          );
    }
    //ҹ��ƹ�ͼ����
    else if (layer === 'nightEarth') {
        layers.removeAll();
        const layer_2 = viewer.imageryLayers.addImageryProvider(
            await Cesium.IonImageryProvider.fromAssetId(3812),
        );
    }
    //���ͼ����
    else if (layer === 'tianditu') {
        layers.removeAll();

        //����Ӱ��
        const img = new Cesium.UrlTemplateImageryProvider({
            url: tdtUrl + 'DataServer?T=img_w&x={x}&y={y}&l={z}&tk=' + token,
            subdomains: subdomains,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 18

        });
        viewer.imageryLayers.addImageryProvider(img);

        //���������
        const boundary = new Cesium.UrlTemplateImageryProvider({
            url: tdtUrl + 'DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=' + token,
            subdomains: subdomains,
            tilingScheme: new Cesium.WebMercatorTilingScheme(),
            maximumLevel: 10
        });
        viewer.imageryLayers.addImageryProvider(boundary);

        //�������
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