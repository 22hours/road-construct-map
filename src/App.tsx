import React, { useState, useEffect, useRef } from "react";

import "./App.css";
import marker_img from "./img/pin_default.png";

import MapController from "./MapController";
import ZoomController from "./ZoomController";

declare global {
    interface Window {
        naver: any;
        N: any;
        ReactNativeWebView: any;
        start_coords: { latitude: number; longitude: number };
        latitude: string;
        longtitude: string;
    }
}

const App = () => {
    const [map, setMap] = useState<any>();
    const [cadastralLayer, setCadastralLayer] = useState();

    const navermaps = window.naver.maps;
    const load = (url: string, cb: () => void) => {
        var element: any = document.createElement("script");
        var parent = "body";
        var attr = "src";

        element.async = true;
        element.onload = function () {
            cb();
        };
        element.onerror = function () {
            alert("ERROR OCCURED IN MAP");
        };
        element[attr] = url;
        // @ts-ignore
        document[parent].appendChild(element);
    };
    const initMap = () => {
        var clientId = "<CLIENT ID를 넣어주세요>";
        var url = "https://openapi.map.naver.com/openapi/v3/maps.js?clientId=" + clientId;
        load(url, function () {
            var MYNAVERMAP = new navermaps.Map("map", {
                center: new window.naver.maps.LatLng(
                    window.latitude ? parseFloat(window.latitude) : 37.3595704,
                    window.longtitude ? parseFloat(window.longtitude) : 127.105399
                ),
                zoom: 15,
            });

            var CADASTALLAYER = new navermaps.CadastralLayer();
            setMap(MYNAVERMAP);
            setCadastralLayer(CADASTALLAYER);
        });
    };

    useEffect(() => {
        initMap();
    }, []);

    return (
        <>
            {map && cadastralLayer && (
                <>
                    <MapController map={map} cadastralLayer={cadastralLayer} />
                    <ZoomController map={map} />
                </>
            )}
            <div id="map"></div>
        </>
    );
};

export default App;
