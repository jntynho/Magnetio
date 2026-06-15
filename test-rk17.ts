import axios from 'axios';

async function fetchRK() {
    try {
        const url = 'https://www.realitykings.com/scenes?models=64432';
        const response = await axios.get(url, {
             maxRedirects: 0,
             validateStatus: function (status) {
                 return status >= 200 && status < 400; // default
             },
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                 'Cookie': 'iAgree=true'
             }
        });
        console.log('Status:', response.status);
        console.log('Headers:', response.headers);
    } catch (error: any) {
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
        } else {
            console.error(error.message);
        }
    }
}
fetchRK();
