const logDiv = document.getElementById('log');
let showBoot=false;


function isJson(str) {
  try {
	JSON.parse(str);
  } catch (e) {
	return false;
  }
  return true;
}

function numpadding(num) {
  if(num<10){
	return("0"+num);
  }
  return(num);
}

function getCurrentTimestamp() {
	const now = new Date();
	return now.toISOString().replace('T', ' ').substring(0, 19); // "YYYY-MM-DD HH:MM:SS"
  }

function convertToSignedInt16(value) {
  return value > 32767 ? value - 65536 : value;
}

socket.onopen = () => {
  document.getElementById('status').innerText = "connected";
  document.getElementById('status').style.color = 'green'
};

// Üzenet fogadása
socket.onmessage = (event) => {
	
	if(isJson(event.data)){
		
		const data = JSON.parse(event.data); // JSON feldolgozása
		console.log("%j", JSON.parse(event.data));

		fillBootTime(data["starttime"]);

		if(!showBoot ){
			if(60000< parseInt(data["starttime"])){
				document.getElementById('boot').innerHTML = "<a href=\"/reboot\">controller reboot</a> &#8226;";
				showBoot=true;
			}
		}

		// freeHeap
		document.getElementById('freeHeap').innerText = data["fh"]+" bytes";
		if(data["fh"] < 10000 ){
		  document.getElementById('freeHeap').style.color = 'red';
		}else{
		  document.getElementById('freeHeap').style.color = 'black';
		}

		document.getElementById('t1').innerText = convertToSignedInt16(data["154"])/10;
		document.getElementById('t2').innerText = data["155"].toFixed(1)/10;
		document.getElementById('t3').innerText = data["156"].toFixed(1)/10;

		// external temp sensor
		if(data["ets"]){ 
			document.getElementById('t5').innerText = data["ets"].toFixed(1);
			document.getElementById('efficiency').innerText = data["efficiency"].toFixed(1);
		} else if(data["158"]){  
			document.getElementById('t5').innerText = (data["158"]/10).toFixed(1);
			document.getElementById('efficiency').innerText = ((data["158"]/data["155"])*100).toFixed(1);
		}

		document.getElementById('efficiency').innerText = ((data["158"]/data["155"])*100).toFixed(1);

		let workingMode = "Unknown";
		switch(data["51"]) {
			case 0:
				workingMode = "OFF";
			break;
			case 1:
				workingMode = "CA (constant air flow)";
			break;
			case 2:
				workingMode = "LS (link with a 0-10V signal)";
			break;
			case 4:
				workingMode = "CPs (constant pressure mode)";
			break;
			case 5:
				workingMode = "CAs";
			break;
			case 6:
				workingMode = "TQ (Constant Torque)";
			break;        
			case 9:
				workingMode = "INIT (temporary mode during init of pressure alarm or init of CPs mode)";
			break;
			default:
				workingMode = "Unknown";
		} 

		document.getElementById('workingMode').innerText = workingMode;

		let unit = "";
		switch(data["54"]) {
			case 0:
				unit = "m<sup>3</sup>/h";
			break;
			case 1:
				unit = "Pa";
			break;
			case 2:
				unit = "0,1V";
			break;
			case 3:
				unit = "percentage of maximum torque (%)";
			break;
			default:
				unit = "";
		} 

		document.getElementById('current_setpoint').innerHTML = data["53"] + " " + unit;

		document.getElementById('supply_fan').innerHTML = data["64"] + unit + " <font style='color: #999;'>•</font> " + data["65"] + "Pa <font style='color: #999;'>•</font> " + ((data["66"]/255)*100).toFixed(1) + "%<font style='color: #999;'>@</font>" +data["67"] + "rpm";		
		//document.getElementById('supply_fan').innerHTML += " ("+data["64"]+", "+data["65"]+", "+data["66"]+", "+data["67"]+")";
		
		document.getElementById('exhaust_fan').innerHTML = data["72"] + unit + " <font style='color: #999;'>•</font> " + data["73"] + "Pa <font style='color: #999;'>•</font> " + ((data["74"]/255)*100).toFixed(1) + "%<font style='color: #999;'>@</font>" +data["75"] + "rpm";
		//document.getElementById('exhaust_fan').innerHTML += " ("+data["72"]+", "+data["73"]+", "+data["74"]+", "+data["75"]+")";

		let bypassStatus = "Unknown";
		switch(data["83"]) {
			case 0:
				bypassStatus = "CLOSED";
			break;
			case 1:
				bypassStatus = "OPEN - " + data["90"] + " %";
			break;
			case 2:
				bypassStatus = "PARTIALLY OPEN - "  + data["90"] + " %";
			break;
			default:
				bypassStatus = "";
		} 


		document.getElementById('bypass_status').innerText = bypassStatus;
		let antifreezeStatus = "-";
		if(data["82"] == 0){  
			antifreezeStatus = "INACTIVE";
		}else if(data["82"] == 1){  
			let percent = ((data["56"]/data["55"])*100).toFixed(0);
			antifreezeStatus = "ACTIVE (in setpoint: "+ data["55"]  + unit + ", out setpoint: "+ data["56"]  + unit + " - "+percent+"%)";			
		}
		
		document.getElementById('antifreeze_status').innerHTML = antifreezeStatus;    

		let curentSpeed = "";

		document.getElementById('auto').classList.remove('selectedBtn');
		document.getElementById('I').classList.remove('selectedBtn');
		document.getElementById('II').classList.remove('selectedBtn');
		document.getElementById('III').classList.remove('selectedBtn');
		document.getElementById('boost').classList.remove('selectedBtn');


		if(data["227"] == "1"){
			curentSpeed = "boost";
			document.getElementById('boost').classList.add('selectedBtn');
		} else if(data["86"] == "6"){
			document.getElementById('auto').classList.add('selectedBtn');
		} else {

			switch(data["52"]) {
				case 0:
					curentSpeed = "STOP";
				break;
				case 1:
					curentSpeed = "1 - LOW";
					document.getElementById('I').classList.add('selectedBtn');
				break;
				case 2:
					curentSpeed = "2- MEDIUM";
					document.getElementById('II').classList.add('selectedBtn');
				break;
				case 3:
					curentSpeed = "3- HIGH";
					document.getElementById('III').classList.add('selectedBtn');
				break;

				default:
					curentSpeed = "";
			}   
		}

		document.getElementById('I').innerHTML=data["427"] + " " + unit;
		document.getElementById('II').innerHTML=data["428"] + " " + unit;
		document.getElementById('III').innerHTML=data["429"] + " " + unit;
		document.getElementById('boost').innerHTML="Boost - "+data["547"] + " " + unit;


		// Két 16 bites változó
		const low16 = data["80"]; // alsó 16 bit
		const high16 = data["81"]; // felső 16 bit

		// Összefűzés 32 bitre
		const workingHours = (high16 << 16) | low16;
		const workingDays = (workingHours/24)%365;
		const workingYears = (workingHours/24)/365;
		document.getElementById('workingTime').innerText = workingYears.toFixed(0) + " years " + workingDays.toFixed(0) + " days " + (workingHours%24).toFixed(0) + " hours (summa: "+workingHours+" hours)";

		let controlMode = "Unknown";
			switch(data["86"]) {
			case 1:
				controlMode = "FATAL ERROR: Fans are stopped";
			break;
			case 2:
				controlMode = "FIRE ALARM (registers 40511 and 40512)";
			break;
			case 3:
				controlMode = "RC: remote control RC TAC5";
			break;
			case 4:
				controlMode = "EXTERNAL CONTACTS: K1-K2-K3 contacts";
			break;
			case 5:
				controlMode = "TIMESCHEDULER"; // TIMESCHEDULER configured by the RC TAC5
			break;        
			case 6:
				controlMode = "TIMESCHEDULER"; // TIMESCHEDULER configured by MODBUS or by the GRC
			break;
			case 7:
				controlMode = "MODBUS register 40201";
			break;
			case 8:
				controlMode = "BYPASS"; // BYPASS (registers 40516 and 40517)
			break;
			case 9:
				controlMode = "BOOST"; //BOOST (registers 40548 and 40549)
			break;
			case 10:
				controlMode = "MODBUS registers 40204 and 40205";
			break;
			case 11:
				controlMode = "KNX";
			break;
			default:
				controlMode = "Unknown";
		} 

		document.getElementById('controlMode').innerText = controlMode;

		let digitalOutputs = data["167"];
		let digitalOutputsString = "";
		if((digitalOutputs >> 0) & 1){ digitalOutputsString = "AL1 alarm, "; }
		if((digitalOutputs >> 1) & 1){ digitalOutputsString += "BYPASS 1, "; }
		if((digitalOutputs >> 2) & 1){ digitalOutputsString += "BYPASS 2, "; }
		if((digitalOutputs >> 3) & 1){ digitalOutputsString += "CT, "; }
		if((digitalOutputs >> 4) & 1){ digitalOutputsString += "KWin, "; }
		if((digitalOutputs >> 5) & 1){ digitalOutputsString += "KWout, "; }   
		if((digitalOutputs >> 6) & 1){ digitalOutputsString += "pressure alarm, "; }    
		if((digitalOutputs >> 7) & 1){ digitalOutputsString += "fan on, "; }
		if((digitalOutputs >> 8) & 1){ digitalOutputsString += "water pump NV, "; }   
		if((digitalOutputs >> 9) & 1){ digitalOutputsString += "bypass on, "; } 
		if((digitalOutputs >> 10) & 1){ digitalOutputsString += "SATBA WP, "; } 
		if((digitalOutputs >> 11) & 1){ digitalOutputsString += "SATBA OUT9 KWext, "; }     

		if(1<digitalOutputsString.length){
		digitalOutputsString = digitalOutputsString.substring(0, digitalOutputsString.length - 2);
		}

		document.getElementById('digitalOutputsString').innerText = digitalOutputsString;


		document.getElementById('selfTime').innerText = data["404"]+"."+numpadding(data["403"]) + "." + numpadding(data["402"]) + " " + numpadding(data["401"]) + ":" + numpadding(data["400"]) + ":" + numpadding(data["399"]) ;


		document.getElementById('bypassData').innerText = "Tout>"+data["512"]/10+" °C; Tin>"+data["513"]/10+" °C; Tin >= (Tout+1°C)";   

		//websocketRefreshTimemSec
		document.getElementById('websocketRefreshTimemSec').innerText = (data["refr"]/1000)+"s";
		document.getElementById('refresh_time').innerText = getCurrentTimestamp();
		
		if(data["lastFilterChange"]){
			document.getElementById('filterchangetime').innerText = getTimeFromTs(data["lastFilterChange"]*3600000);
		}
 
	};
};

// Kapcsolat bontása
socket.onclose = () => {
  document.getElementById('status').innerText = "disconnected";
  document.getElementById('status').style.color = 'red';
};

function sendMessage(message) {
  console.log("Send message: " + message);
  socket.send(message);
}

function getTimeFromTs(ts){
	console.log(ts);
	let now = new Date(parseInt(ts));
	console.log(now);
	const [month, day, year] = [
	  now.getMonth(),
	  now.getDate(),
	  now.getFullYear(),
	];
	const [hour, minutes, seconds] = [
	  now.getHours(),
	  now.getMinutes(),
	  now.getSeconds(),
	];

	return( year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2));
}


function fillBootTime(btm){

	const tm = new Date();
	let now = new Date(tm.getTime() - parseInt(btm));
	const [month, day, year] = [
	  now.getMonth(),
	  now.getDate(),
	  now.getFullYear(),
	];
	const [hour, minutes, seconds] = [
	  now.getHours(),
	  now.getMinutes(),
	  now.getSeconds(),
	];

	document.getElementById('boot_time').innerText = year + '-' + ('0' + month).slice(-2) + '-' + ('0' + day).slice(-2) + ' ' + ('0' + hour).slice(-2) + ':' + ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
}
  
function fillFooter(){
	document.getElementById('START_MEM').innerText = startmem;
	document.getElementById('sw_ver').innerText = SWVER;
	fillBootTime(starttime);
}
