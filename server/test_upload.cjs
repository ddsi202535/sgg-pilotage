const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    // Login to get token
    const loginResp = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'hlotf2@sgg.gov.ma',
      password: 'azerty',
      profileId: 'CHEF_PROJET'
    });
    const token = loginResp.data.token;

    // Get projects to find a valid ID
    const projectsResp = await axios.get('http://localhost:3001/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projectId = projectsResp.data[0].id;
    console.log('Using project ID:', projectId);

    // Create a dummy file
    const filePath = path.join(__dirname, 'test_upload.txt');
    fs.writeFileSync(filePath, 'Hello from test script');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('name', 'Test Livrable Script');

    const uploadResp = await axios.post(`http://localhost:3001/api/projects/${projectId}/deliverables`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Upload success:', uploadResp.data);
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Upload failed:', err.response?.data || err.message);
  }
}

testUpload();
