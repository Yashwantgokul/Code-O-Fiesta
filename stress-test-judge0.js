const url = 'http://34.180.2.10:2358/submissions?base64_encoded=false&wait=true';
const token = 'eFMAOXQGXCVIAftrajraEJKjI2Q1BpVOvwxfOY146d3Sx8pwoA';

// Language IDs: 54=C++, 62=Java, 71=Python, 63=JavaScript
const programs = [
  {
    language_id: 54,
    source_code: `#include <iostream>\nusing namespace std;\nint main() {\n  int sum = 0;\n  for(int i=0; i<1000000; i++) sum += i;\n  cout << sum << endl;\n  return 0;\n}`,
    name: 'C++'
  },
  {
    language_id: 62,
    source_code: `public class Main {\n  public static void main(String[] args) {\n    long sum = 0;\n    for(int i=0; i<1000000; i++) sum += i;\n    System.out.println(sum);\n  }\n}`,
    name: 'Java'
  },
  {
    language_id: 71,
    source_code: `sum = 0\nfor i in range(1000000):\n  sum += i\nprint(sum)`,
    name: 'Python'
  },
  {
    language_id: 63,
    source_code: `let sum = 0;\nfor(let i=0; i<1000000; i++) sum += i;\nconsole.log(sum);`,
    name: 'JavaScript'
  }
];

const NUM_CONCURRENT = 30; // Number of parallel submissions to send

async function submitCode(id) {
  const prog = programs[Math.floor(Math.random() * programs.length)];
  const startTime = Date.now();
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language_id: prog.language_id,
        source_code: prog.source_code
      })
    });
    
    const data = await res.json();
    const duration = Date.now() - startTime;
    
    if (res.ok) {
      console.log(`[Req ${id}] [${prog.name}] ✅ Success in ${duration}ms | Time: ${data.time}s | Mem: ${data.memory}KB`);
      return { success: true, duration };
    } else {
      console.log(`[Req ${id}] [${prog.name}] ❌ Failed in ${duration}ms | Status: ${res.status}`);
      return { success: false, duration };
    }
  } catch (e) {
    console.log(`[Req ${id}] [${prog.name}] ❌ Error: ${e.message}`);
    return { success: false, duration: Date.now() - startTime };
  }
}

async function runStressTest() {
  console.log(`🚀 Starting Judge0 Stress Test...`);
  console.log(`📦 Sending ${NUM_CONCURRENT} submissions concurrently...`);
  console.log(`-----------------------------------------------------`);
  
  const startTime = Date.now();
  
  // Fire all promises concurrently
  const promises = [];
  for (let i = 1; i <= NUM_CONCURRENT; i++) {
    promises.push(submitCode(i));
  }
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successful = results.filter(r => r.success).length;
  
  console.log(`-----------------------------------------------------`);
  console.log(`🏁 Stress Test Completed in ${totalTime}ms`);
  console.log(`📊 Successful: ${successful} / ${NUM_CONCURRENT}`);
  if (successful > 0) {
    const avg = results.reduce((acc, curr) => acc + curr.duration, 0) / NUM_CONCURRENT;
    console.log(`⏱️ Average response time per request: ${avg.toFixed(2)}ms`);
    console.log(`⚙️ Processed ~${(NUM_CONCURRENT / (totalTime/1000)).toFixed(2)} submissions per second`);
  }
}

runStressTest();
