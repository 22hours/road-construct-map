import React, { useState, useEffect } from "react";

// TYPES
type FirstMarkerItem = {
    article_id: number | string;
    shorten_address: string;
    latitude: number; // 위도 33 ~
    longitude: number; // 경도 127 ~
};

type FirstMarkers = Array<FirstMarkerItem>;
const first_markers: FirstMarkers = [
    { article_id: 1, shorten_address: "도로개설", latitude: 37.3595704, longitude: 127.105399 },
    { article_id: 2, shorten_address: "도로개설", latitude: 37.3699814, longitude: 127.106399 },
    { article_id: 3, shorten_address: "도로개설", latitude: 37.3690926, longitude: 127.105399 },
];

const MapController = ({ map, cadastralLayer }: { map: any; cadastralLayer: any }) => {
    const [markers, setMarkers] = useState<Array<any>>([]);

    type dataType = {
        mapType: "normal" | "satellite" | "terrain";
    };
    type Action =
        | { type: "SET_MAP_TYPE"; data: dataType["mapType"] }
        | { type: "LOAD_MARKERS"; data: Array<FirstMarkerItem> }
        | { type: "REMOVE_ALL_MARKERS" }
        | { type: "UPDATE_MARKER_RENDER" }
        | { type: "HIDE_MARKER"; marker: any }
        | { type: "SHOW_MARKER"; marker: any }
        | { type: "TOGGLE_CADASTRAL" }
        | { type: "MOVE_CURRENT_LOCATION" };

    const dispatch = (action: Action) => {
        switch (action.type) {
            case "SET_MAP_TYPE": {
                var newMapType = action.data;
                map.setMapTypeId(newMapType);
                break;
            }
            case "LOAD_MARKERS": {
                var cur_markers: Array<any> = [];
                const request_marker_data = action.data;
                request_marker_data.forEach((element) => {
                    var coordinates: { latitude: number; longitude: number } = {
                        latitude: element.latitude,
                        longitude: element.longitude,
                    };
                    var position = new window.naver.maps.LatLng(coordinates.latitude, coordinates.longitude);
                    var markerOptions = {
                        position: position,
                        map: map,
                        title: "Green",
                        icon: {
                            content: [
                                '<div class="article_marker">',
                                '<div class="marker_container">',
                                `<div class="marker_title">${element.shorten_address}</div>`,
                                // `<div class="marker_step">${element.step}</div>`,
                                "</div>",
                                "</div>",
                            ].join(""),
                            size: new window.naver.maps.Size(38, 58),
                            anchor: new window.naver.maps.Point(19, 58),
                        },
                    };
                    var marker = new window.naver.maps.Marker(markerOptions);
                    window.naver.maps.Event.addListener(marker, "click", function (e: any) {
                        sendPostMessageToApp({ type: "CLICK_MARKER", data: element });
                    });
                    cur_markers.push(marker);
                });
                setMarkers(cur_markers);
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
            case "MOVE_CURRENT_LOCATION": {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            //SUCCESS
                            var location = new window.naver.maps.LatLng(
                                position.coords.latitude,
                                position.coords.longitude
                            );
                            map.setCenter(location);
                        },
                        () => {
                            //ERROR
                            sendPostMessageToApp({ type: "GEOLOCATION_ERROR" });
                        }
                    );
                }
                break;
            }
            default:
                return;
        }
    };

    type sendAction =
        | { type: "CLICK_MARKER"; data: any }
        | { type: "MAP_LOAD_END" }
        | { type: "CLICK_MAP" }
        | { type: "GEOLOCATION_ERROR" };
    const sendPostMessageToApp = (action: sendAction) => {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(action));
        }
    };
    var receivePostMessageFromApp = (event: any) => {
        var dataObj = JSON.parse(event.data);
        dispatch(dataObj);
    };

    useEffect(() => {
        if (map) {
            dispatch({ type: "MOVE_CURRENT_LOCATION" });
        }
    }, [map]);

    // BUSINESS LOGIC
    useEffect(() => {
        if (markers) {
            var event = window.naver.maps.Event.addListener(map, "idle", function (e: any) {
                var cur_zoom: number = map.zoom;
                console.log("ZOOM", map.zoom);
                if (cur_zoom >= 11) {
                    dispatch({ type: "UPDATE_MARKER_RENDER" });
                } else {
                    dispatch({ type: "REMOVE_ALL_MARKERS" });
                }
            });
            var click_event = window.naver.maps.Event.addListener(map, "click", function (e: any) {
                sendPostMessageToApp({ type: "CLICK_MAP" });
            });
        }
        return () => {
            window.naver.maps.Event.removeListener(event);
            window.naver.maps.Event.removeListener(click_event);
        };
    }, [markers]);

    useEffect(() => {
        window.addEventListener("message", receivePostMessageFromApp, false);
        document.addEventListener("message", receivePostMessageFromApp, false);
        sendPostMessageToApp({ type: "MAP_LOAD_END" });
        return () => {
            window.removeEventListener("message", receivePostMessageFromApp);
            document.removeEventListener("message", receivePostMessageFromApp);
        };
    }, []);

    return (
        <div className="control_pannel">
            {/* <button onClick={() => dispatch({ type: "LOAD_MARKERS", data: first_markers })}>기본</button> */}

            {window.ReactNativeWebView === undefined && (
                <>
                    <div>개발자모드 이용 중</div>
                    <button onClick={() => dispatch({ type: "SET_MAP_TYPE", data: "normal" })}>기본</button>
                    <button onClick={() => dispatch({ type: "SET_MAP_TYPE", data: "satellite" })}>위성</button>
                    <button onClick={() => dispatch({ type: "SET_MAP_TYPE", data: "terrain" })}>지적도</button>
                    <button onClick={() => dispatch({ type: "REMOVE_ALL_MARKERS" })}>마커 삭제하기</button>
                    <button onClick={() => dispatch({ type: "TOGGLE_CADASTRAL" })}>지적 편집도 켜기</button>
                </>
            )}
        </div>
    );
};

export default MapController;
