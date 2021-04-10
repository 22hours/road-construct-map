import React, { useState, useEffect, useRef } from "react";

import "./App.css";
declare global {
    interface Window {
        naver: any;
        N: any;
    }
}
const dummy_marker_datas = [
    [37.3595704, 127.105399],
    [37.3699814, 127.105399],
    [37.3690926, 127.105399],
];
const ControlPanel = ({ map }: { map: any }) => {
    const [markers, setMarkers] = useState<Array<any>>([]);
    const [infoWindows, setInfoWindows] = useState<Array<any>>([]);

    type ValueType = {
        mapType: "normal" | "satellite" | "terrain";
    };
    type Action =
        | { type: "SET_MAP_TYPE"; value: ValueType["mapType"] }
        | { type: "LOAD_MARKERS" }
        | { type: "REMOVE_ALL_MARKERS" }
        | { type: "UPDATE_MARKER_RENDER" }
        | { type: "HIDE_MARKER"; marker: any }
        | { type: "SHOW_MARKER"; marker: any };

    const dispatch = (action: Action) => {
        switch (action.type) {
            case "SET_MAP_TYPE": {
                var newMapType = action.value;
                console.log(window.naver.maps.MapTypeId);
                map.setMapTypeId(newMapType);
                break;
            }
            case "LOAD_MARKERS": {
                var cur_markers: Array<any> = [];
                var cur_infoWindows: Array<any> = [];

                // MARKER RENDER
                dummy_marker_datas.forEach((element) => {
                    var position = new window.naver.maps.LatLng(element[0], element[1]);
                    var marker = new window.naver.maps.Marker({
                        map: map,
                        position: position,
                        animation: window.naver.maps.Animation.DROP,
                    });
                    var contentString = [
                        '<div class="iw_inner">',
                        "   <h3>서울특별시청</h3>",
                        "   <p>서울특별시 중구 태평로1가 31 | 서울특별시 중구 세종대로 110 서울특별시청<br />",
                        "       02-120 | 공공,사회기관 &gt; 특별,광역시청<br />",
                        '       <a href="http://www.seoul.go.kr" target="_blank">www.seoul.go.kr/</a>',
                        "   </p>",
                        "</div>",
                    ].join("");

                    var infowindow = new window.naver.maps.InfoWindow({
                        content: contentString,
                    });

                    window.naver.maps.Event.addListener(marker, "click", function (e: any) {
                        if (infowindow.getMap()) {
                            infowindow.close();
                        } else {
                            infowindow.open(map, marker);
                        }
                    });

                    cur_markers.push(marker);
                    cur_infoWindows.push(infowindow);
                });
                setMarkers(cur_markers);
                setInfoWindows(cur_infoWindows);
                break;
            }
            case "REMOVE_ALL_MARKERS": {
                infoWindows.forEach((element) => {
                    element.close();
                });
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
                console.log("UPDATE MARKERS");
                console.log(markers);
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

    return (
        <div className="control_pannel">
            <button onClick={() => dispatch({ type: "SET_MAP_TYPE", value: "normal" })}>기본</button>
            <button onClick={() => dispatch({ type: "SET_MAP_TYPE", value: "satellite" })}>위성</button>
            <button onClick={() => dispatch({ type: "SET_MAP_TYPE", value: "terrain" })}>지적도</button>
            <button onClick={() => dispatch({ type: "LOAD_MARKERS" })}>마커 로드하기</button>
            <button onClick={() => dispatch({ type: "REMOVE_ALL_MARKERS" })}>마커 삭제하기</button>
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
            {map && <ControlPanel map={map} />}
            <div id="map"></div>
        </>
    );
};

export default App;
