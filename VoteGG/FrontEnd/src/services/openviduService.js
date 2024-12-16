import axios from 'axios';

const APPLICATION_SERVER_URL =
    process.env.NODE_ENV === 'production' ? '' : 'https://demos.openvidu.io/';

export const getToken = async (sessionId) => {
    const session = await createSession(sessionId);
    return createToken(session);
};

const createSession = async (sessionId) => {
    const response = await axios.post(
        `${APPLICATION_SERVER_URL}api/sessions`,
        { customSessionId: sessionId },
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data; // Session ID
};

const createToken = async (sessionId) => {
    const response = await axios.post(
        `${APPLICATION_SERVER_URL}api/sessions/${sessionId}/connections`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data; // Token
};
