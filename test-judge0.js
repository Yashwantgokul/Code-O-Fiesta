const url = 'http://34.180.2.10:2358/system_info';
const token = 'eFMAOXQGXCVIAftrajraEJKjI2Q1BpVOvwxfOY146d3Sx8pwoA';

async function test() {
  console.log(`Testing URL: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'X-Auth-Token': token
      }
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text.substring(0, 150)}...`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test();
