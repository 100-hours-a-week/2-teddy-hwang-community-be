const dayjs = require('dayjs');

// 대한민국 시간으로 변환하여 yyyy-mm-dd hh:mm:ss 형식 반환
const getTimestamp = () => {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
};
  
module.exports = {
    getTimestamp,
};