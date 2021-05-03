import React, { useState, useEffect } from "react";
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

export default ZoomController;
