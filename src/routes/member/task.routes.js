const express = require('express');
const router = express.Router();
const {
    getTodaysMeetings,
    getYesterdaysMeetings,
    getMeetingDetails,
    getAllMeetings
} = require('../../controllers/member/meetingAndMom.controller');

