import React, { useState, useEffect } from "react";

const ScreenShareComponent = ({ session }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [screenPublisher, setScreenPublisher] = useState(null);

    useEffect(() => {
        return () => {
            // 화면 공유 중단
            if (screenPublisher) {
                screenPublisher.stream.getMediaStream().getTracks().forEach((track) => track.stop());
                session.unpublish(screenPublisher);
            }
        };
    }, [screenPublisher]);

    const startScreenShare = async () => {
        try {
            const publisher = session.initPublisher(undefined, {
                videoSource: "screen",
                audioSource: "screen",
                publishAudio: true,
                publishVideo: true,
            });

            publisher.once("accessAllowed", () => {
                session.publish(publisher);
                setScreenPublisher(publisher);
                setIsSharing(true);
                //console.log("Screen sharing started");
            });

            publisher.once("accessDenied", () => {
                console.error("Screen sharing denied");
            });
        } catch (error) {
            console.error("Error during screen sharing:", error);
        }
    };

    const stopScreenShare = () => {
        if (screenPublisher) {
            screenPublisher.stream.getMediaStream().getTracks().forEach((track) => track.stop());
            session.unpublish(screenPublisher);
            setScreenPublisher(null);
            setIsSharing(false);
        }
    };

    return (
        <div>
            <button onClick={isSharing ? stopScreenShare : startScreenShare}>
                {isSharing ? "Stop Screen Sharing" : "Start Screen Sharing"}
            </button>
        </div>
    );
};

export default ScreenShareComponent;
