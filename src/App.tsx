import React, { useState, useEffect, useRef } from "react";

import "./App.css";
import marker_img from "./img/pin_default.png";
declare global {
    interface Window {
        naver: any;
        N: any;
        ReactNativeWebView: any;
    }
}

////////////////////////////////////////////////////////////////////////////////////
// FIRST MARKERS
type FirstMarkerItem = {
    id: number | string;
    title: string;
    step: string;
    coordinates: {
        latitude: number; // 위도 33 ~
        longitude: number; // 경도 127 ~
    };
};
type FirstMarkers = Array<FirstMarkerItem>;
const first_markers: FirstMarkers = [
    { id: 1, title: "도로개설", step: "의견청취", coordinates: { latitude: 37.3595704, longitude: 127.105399 } },
    { id: 2, title: "도로개설", step: "의견청취", coordinates: { latitude: 37.3699814, longitude: 127.106399 } },
    { id: 3, title: "도로개설", step: "완료", coordinates: { latitude: 37.3690926, longitude: 127.105399 } },
];

//////////////////////////////////////////////////////////////////////
// SECOND MARKERS
type SecondMarkerItem = {
    id: number | string;
    lable: string;
    coordinates: {
        latitude: number; // 위도 33 ~
        longitude: number; // 경도 127 ~
    };
};

type SecondMarkers = Array<SecondMarkerItem>;
const second_markers: SecondMarkers = [
    { id: 1, lable: "시점", coordinates: { latitude: 37.3595704, longitude: 127.105399 } },
    { id: 2, lable: "시점", coordinates: { latitude: 37.3699814, longitude: 127.105399 } },
    { id: 3, lable: "종점", coordinates: { latitude: 37.3690926, longitude: 127.105399 } },
];

const dummy_detail_markers = [
    [37.3695704, 127.105399],
    [37.3999814, 127.105399],
    [37.3790926, 127.105399],
];

const ZoomController = ({ map }: { map: any }) => {
    const [zoom, setZoom] = useState<number>(14);
    useEffect(() => {
        var event = window.naver.maps.Event.addListener(map, "idle", function (e: any) {
            var cur_zoom: number = map.zoom;
            setZoom(cur_zoom);
        });
        return () => {
            window.naver.maps.Event.removeListener(event);
        };
    }, [map]);
    return (
        <>
            {zoom < 14 && (
                <div className="zoom_alert">
                    <span>지도를 더 확대해 주세요</span>
                </div>
            )}
        </>
    );
};

const ControlPanel = ({ map }: { map: any }) => {
    const [markers, setMarkers] = useState<Array<any>>([]);
    const [cadastralLayer, setCadastralLayer] = useState<any>(new window.naver.maps.CadastralLayer());

    type ValueType = {
        mapType: "normal" | "satellite" | "terrain";
    };
    type Action =
        | { type: "SET_MAP_TYPE"; value: ValueType["mapType"] }
        | { type: "LOAD_MARKERS" }
        | { type: "LOAD_DETAIL_MARKERS" }
        | { type: "REMOVE_ALL_MARKERS" }
        | { type: "UPDATE_MARKER_RENDER" }
        | { type: "HIDE_MARKER"; marker: any }
        | { type: "SHOW_MARKER"; marker: any }
        | { type: "TOGGLE_CADASTRAL" };

    const dispatch = (action: Action) => {
        switch (action.type) {
            case "SET_MAP_TYPE": {
                var newMapType = action.value;
                map.setMapTypeId(newMapType);
                break;
            }
            case "LOAD_MARKERS": {
                var cur_markers: Array<any> = [];

                // MARKER RENDER
                first_markers.forEach((element) => {
                    var coordinates = element.coordinates;

                    var position = new window.naver.maps.LatLng(coordinates.latitude, coordinates.longitude);
                    var markerOptions = {
                        position: position,
                        map: map,
                        title: "Green",
                        icon: {
                            content: [
                                '<div class="article_marker">',
                                '<div class="marker_container">',
                                `<div class="marker_title">${element.title}</div>`,
                                `<div class="marker_step">${element.step}</div>`,
                                "</div>",
                                "</div>",
                            ].join(""),
                            size: new window.naver.maps.Size(38, 58),
                            anchor: new window.naver.maps.Point(19, 58),
                        },
                    };
                    var marker = new window.naver.maps.Marker(markerOptions);

                    window.naver.maps.Event.addListener(marker, "click", function (e: any) {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(
                                JSON.stringify({ type: "CLICK_ARTICLE_MARKER", value: element })
                            );
                        }
                    });

                    cur_markers.push(marker);
                });
                setMarkers(cur_markers);
                break;
            }
            case "LOAD_DETAIL_MARKERS": {
                console.log("DETAIL MARKER LOAD!");
                // MARKER RENDER
                dummy_detail_markers.forEach((element) => {
                    var position = new window.naver.maps.LatLng(element[0], element[1]);
                    var markerOptions = {
                        position: position,
                        map: map,
                        title: "Green",
                        icon: {
                            content: [
                                '<div class="article_marker">',
                                '<div class="map_group _map_group crs">',
                                '<div class="map_marker _marker num1 num1_big"> ',
                                '<span class="ico _icon"></span>',
                                '<span class="shd">1</span>',
                                "</div>",
                                "</div>",
                                "</div>",
                            ].join(""),
                            size: new window.naver.maps.Size(38, 58),
                            anchor: new window.naver.maps.Point(19, 58),
                        },
                    };
                    var marker = new window.naver.maps.Marker(markerOptions);

                    window.naver.maps.Event.addListener(marker, "click", function (e: any) {});
                });
                break;
            }
            case "REMOVE_ALL_MARKERS": {
                markers.forEach((element) => {
                    element.setMap(null);
                });
                break;
            }
            case "HIDE_MARKER": {
                action.marker.setMap(null);
                break;
            }
            case "SHOW_MARKER": {
                action.marker.setMap(map);
                break;
            }
            case "UPDATE_MARKER_RENDER": {
                var mapBounds = map.getBounds();
                var position;
                markers.forEach((cur_marker) => {
                    position = cur_marker.getPosition();
                    if (mapBounds.hasLatLng(position)) {
                        if (cur_marker.map === null) {
                            dispatch({ type: "SHOW_MARKER", marker: cur_marker });
                        }
                    } else {
                        if (cur_marker.map !== null) {
                            dispatch({ type: "HIDE_MARKER", marker: cur_marker });
                        }
                    }
                });
                break;
            }
            case "TOGGLE_CADASTRAL": {
                if (cadastralLayer.getMap()) {
                    cadastralLayer.setMap(null);
                } else {
                    cadastralLayer.setMap(map);
                }
                break;
            }
            default:
                return;
        }
    };

    useEffect(() => {
        if (markers) {
            var event = window.naver.maps.Event.addListener(map, "idle", function (e: any) {
                var cur_zoom: number = map.zoom;
                console.log("ZOOM", map.zoom);

                if (cur_zoom >= 14) {
                    dispatch({ type: "UPDATE_MARKER_RENDER" });
                } else {
                    dispatch({ type: "REMOVE_ALL_MARKERS" });
                }
            });
        }
        return () => {
            window.naver.maps.Event.removeListener(event);
        };
    }, [markers]);

    // BUSINESS LOGIC
    useEffect(() => {
        var dispatchWebviewPostMessage = (event: any) => {
            var dataObj = JSON.parse(event.data);
            dispatch({ type: dataObj.type, value: dataObj.value });
        };
        window.addEventListener("message", dispatchWebviewPostMessage, false);
        document.addEventListener("message", dispatchWebviewPostMessage, false);
        return () => {
            window.removeEventListener("message", dispatchWebviewPostMessage);
            document.removeEventListener("message", dispatchWebviewPostMessage);
        };
    }, []);

    return (
        <div className="control_pannel">
            <button onClick={() => dispatch({ type: "LOAD_MARKERS" })}>마커 로드하기</button>

            {window.ReactNativeWebView === undefined && (
                <>
                    <div>개발자모드 이용 중</div>
                    <button onClick={() => dispatch({ type: "SET_MAP_TYPE", value: "normal" })}>기본</button>
                    <button onClick={() => dispatch({ type: "SET_MAP_TYPE", value: "satellite" })}>위성</button>
                    <button onClick={() => dispatch({ type: "SET_MAP_TYPE", value: "terrain" })}>지적도</button>
                    <button onClick={() => dispatch({ type: "LOAD_MARKERS" })}>마커 로드하기</button>
                    <button onClick={() => dispatch({ type: "LOAD_DETAIL_MARKERS" })}>디테일 마커 로드하기</button>
                    <button onClick={() => dispatch({ type: "REMOVE_ALL_MARKERS" })}>마커 삭제하기</button>
                    <button onClick={() => dispatch({ type: "TOGGLE_CADASTRAL" })}>지적 편집도 켜기</button>
                </>
            )}
        </div>
    );
};

const App = () => {
    const [map, setMap] = useState<any>();

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
        var clientId = "rendh30mcy";
        var url = "https://openapi.map.naver.com/openapi/v3/maps.js?clientId=" + clientId;
        load(url, function () {
            var MYNAVERMAP = new navermaps.Map("map", {
                center: new window.naver.maps.LatLng(37.3595704, 127.105399),
                zoom: 15,
            });
            setMap(MYNAVERMAP);
        });
    };

    useEffect(() => {
        initMap();
    }, []);

    return (
        <>
            {map && (
                <>
                    <ControlPanel map={map} />
                    <ZoomController map={map} />
                </>
            )}
            <div id="map"></div>
        </>
    );
};

export default App;
