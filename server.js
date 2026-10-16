import { loadEnvironment } from './les-5/config.js';
loadEnvironment();
const { createRuntime } = await import('./les-8/app.js');
const runtime = createRuntime();
const port=Number(process.env.PORT||3001);
const server=runtime.app.listen(port,'127.0.0.1',()=>console.log('StudieKompas · Agent vervroegt: http://localhost:'+port+'/'));
function stop(){server.close(()=>{runtime.close();process.exit(0);});}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
