function addItemScan(){
	Rho.Log.info("Start: addItemScan()", "inMotion");
	$.get("/public/templates/addItemScan.html", function(data){
		modal.open({
			content: data
		}, function(){
			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var prefix = $("#prefix").val().toUpperCase();
			var unit = $("#unit").val();
			var errMsgs = [];
			var sql;
			var sqlExpression;
			
			if (prefix.length === 0) {
				errMsgs.push("Prefix is required.\n" );
			}
			if (prefix.length < 2) {
				errMsgs.push("Prefix has to be at least 2 characters.\n" );
			}
			var numbers = /^[0-9]+$/;
		    if(!unit.match(numbers)){
		    	errMsgs.push("Unit can only contain numeric characters. \n");
		    }
			else {
				if (parseInt(unit, 10) <= 0 || parseInt(unit, 10) > 9999){
					errMsgs.push("Unit must be in the range 1 to 9999. \n");
				}
			}
		    if (unit.length > 4){
		    	errMsgs.push("Unit has more than 4 characters. \n");
		    }
		    
			//check to see if this prefix unit has already been scanned
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = prefix;
			sqlExpression[2] = unit;

			sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeInitials, ";
			sql += "prefix, ";
			sql += "purchaseOrder, ";
			sql += "reasonRefused, ";
			sql += "refusedFlag, ";
			sql += "transferDate, ";
			sql += "transferNumber, ";
			sql += "localTransferNumber, ";
			sql += "uhsPatientId, ";
			sql += "unit, ";
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber <> ? ";			
			sql += "and prefix = ? ";
			sql += "and unit = ? ";
			var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);
			if (transferDetailArray.length > 0){
				errMsgs.push("Prefix/Unit has already been scanned.\n" );
			}

			if (errMsgs.length !== 0) {
				alert('The following error(s) must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
				return false;
			}
			else {
				if (prefix.length == 2){
					prefix = prefix + " ";
				}
				unit = formatNumberLength(unit, 4);

				var jsonObj = {};
				jsonObj.data = prefix + unit;
				jsonObj.source = "modal";
				var scanLevel = $("#taskHeaderContainer").attr("data-scanLevel");
				if (scanLevel == "0"){
					scannerCallbackMode1(jsonObj);
				}
				else if (scanLevel == "1"){
					scannerCallbackMode2(jsonObj);
				}
				else {

				}
				enableScanner();
			}
		});
	});
	Rho.Log.info("End: addItemScan", "inMotion");
}

function assignTaskPatient(id){
	Rho.Log.info("Start: assignTaskPatient()", "inMotion");

	var localTransferId = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var sqlExpression = [];
	sqlExpression[0] = localTransferId;

	var sql = "SELECT p.accountId, ";
	sql += "p.additionalPatientId, ";
	sql += "p.deliveryLocation, ";
	sql += "p.firstName, ";
	sql += "p.hospitalPatientId, ";
	sql += "p.lastName, ";
	sql += "p.localUhsPatientId, ";
	sql += "p.middleInitial, ";
	sql += "p.physiciansId, ";
	sql += "p.roomNumber, ";
	sql += "p.tradingPartnerId, ";
	sql += "p.uhsPatientId, ";
	sql += "p.object, ";
	sql += "p.firstName || case when length(p.middleInitial) > 0 then ' ' || p.middleInitial else '' end || ' ' || p.lastName as patientName ";
	sql += "from TransferHeader th ";
	sql += "inner join Patient p ";
	sql += "on th.accountId = p.accountid ";
	sql += "where localTransferNumber = ? ";
	var patientArray = userDatabase.executeSql(sql, sqlExpression);

	var patientList = [];
	for (var i=0; i < patientArray.length; i++){
		//create json patient
		var patient = patientArray[i];
		var patientName = patientArray[i].patientName;
		if (patientName.length > 20) {
			patient.patientName = patientName.substr(0,20) + "...";
		}
		else {
			patient.patientName = patientName;
		}

		if (patientArray[i].uhsPatientId != 0){
			patient.dspUhsPatientId = patientArray[i].uhsPatientId;
		}
		else {
			patient.dspUhsPatientId = patientArray[i].localUhsPatientId;
		}
		patientList.push(patient);
	}
	var jsonPatients = {};
	jsonPatients.patients = patientList;

	$.get("/public/templates/patientList.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonPatients);
		jsonPatients = null;
		
		modal.open({
			content: templateWithData,
			fullScreen: true,
			enableScroll: true
		}, function(){
			if (id){
				saveAssignItemPatient(id);
			}
			else {
				saveAssignTaskPatient();
			}
		});
		$(".patientList").off("click");
		$(".patientList").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("patientList" + index, "patientList");
		});
		$(".patientContainerText1").off("click");
		$(".patientContainerText1").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("patientList" + index, "patientList");
		});
		$(".patientContainerText2").off("click");
		$(".patientContainerText2").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("patientList" + index, "patientList");
		});
	});
	Rho.Log.info("End: assignTaskPatient", "inMotion");
}

function saveEditOrderItem(mode){
	Rho.Log.info("Start: saveEditOrderItem(" + mode + ")", "inMotion");
	//retrieve data from modal
	//var transferNumber = $("#transferNumber").val();
	var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	var transferNumber = $("#transferNumber").val();
	var localTransferNumber = $("#localTransferNumber").val();
	var transferType = $("#taskHeaderContainer").attr("data-transferType");
	var quantityOrdered = $("#quantityOrdered").val();
	var purchaseOrder = $("#purchaseOrder").val();
	var department = $("#department").val();
	var description = $("#description").val();
	var equipmentOrderId = $("#equipmentOrderId").val();
	var localEquipmentOrderId = $("#localEquipmentOrderId").val();
	var model = $("#model").val();
	var prefix = $("#prefix").val().toUpperCase();
	var vendor = $("#vendor").val();
	var object = $("#object").val();
	var equipmentOrder;
	var sql;
	var sqlExpression;

	//validate data from modal
	var errMsgs = [];
	if (prefix.length === 0) {
		errMsgs.push("Prefix is required.\n" );
	}
	if (quantityOrdered.length === 0){
		errMsgs.push( "Quantity is required. \n");
	}
	else {
		if (isNaN(quantityOrdered)){
			errMsgs.push( "Quantity is not a valid number. \n" );
		}
		if (quantityOrdered === 0){
			errMsgs.push( "Quantity needs to be greater than 0. \n" );
		}
		if (quantityOrdered > 999){
			errMsgs.push( "Quantity cannot be greater than 999. \n");
		}
	}

	if (errMsgs.length !== 0) {
		alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
		return false;
	}
	else {
		if (object.length > 0){
			equipmentOrder = transferEquipmentOrderModel.make({
				"equipmentOrderId": equipmentOrderId,
				"localEquipmentOrderId": localEquipmentOrderId,
			    "transferNumber": transferNumber,
			    "localTransferNumber": localTransferNumber,
				"prefix": prefix,
				"quantityOrdered": quantityOrdered,
				"description": description,
				"model": model,
				"vendor": vendor,
				"purchaseOrder": purchaseOrder,
				"department": department,
				"employeeId": currentEmployeeId,
				"object": object
			});

			equipmentOrder.save();
		}
		else {
			//if an existing record exists for this transfer, prefix, po, dept combination add quantity to existing record else create new record
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = prefix;
			sqlExpression[2] = department;
			sqlExpression[3] = purchaseOrder;

			sql = "SELECT department, ";
			sql += "description, ";
			sql += "equipmentOrderId, ";
			sql += "localEquipmentOrderId, ";
			sql += "localTransferNumber, ";
			sql += "model, ";
			sql += "prefix, ";
			sql += "purchaseOrder, ";
			sql += "quantityOrdered, ";
			sql += "transferNumber, ";
			sql += "vendor, ";
			sql += "object ";
			sql += "from TransferEquipmentOrder ";
			sql += "where localTransferNumber = ? ";
			sql += "and prefix = ? ";
			sql += "and department = ? ";
			sql += "and purchaseOrder = ? ";
			var equipmentOrderArray = userDatabase.executeSql(sql, sqlExpression);
			
			if (equipmentOrderArray.length > 0){
				equipmentOrder = transferEquipmentOrderModel.make({
					"equipmentOrderId": equipmentOrderArray[0].equipmentOrderId,
					"localEquipmentOrderId": equipmentOrderArray[0].localEquipmentOrderId,
				    "transferNumber": equipmentOrderArray[0].transferNumber,
				    "localTransferNumber": equipmentOrderArray[0].localTransferNumber,
					"prefix": equipmentOrderArray[0].prefix,
					"quantityOrdered": parseInt(equipmentOrderArray[0].quantityOrdered,10) + parseInt(quantityOrdered, 10),
					"description": equipmentOrderArray[0].description,
					"model": equipmentOrderArray[0].model,
					"vendor": equipmentOrderArray[0].vendor,
					"purchaseOrder": equipmentOrderArray[0].purchaseOrder,
					"department": equipmentOrderArray[0].department,
					"employeeId": equipmentOrderArray[0].currentEmployeeId,
					"object": equipmentOrderArray[0].object
				});

				equipmentOrder.save();
			}
			else {
				equipmentOrder = transferEquipmentOrderModel.create({
					"equipmentOrderId": "",
					"localEquipmentOrderId": "",
				    "transferNumber": transferNumber,
				    "localTransferNumber": localTransferNumber,
					"prefix": prefix,
					"quantityOrdered": quantityOrdered,
					"description": "",
					"model": "",
					"vendor": "",
					"purchaseOrder": purchaseOrder,
					"department": department,
					"employeeId": currentEmployeeId
				});

				equipmentOrder.updateAttributes({
					"localEquipmentOrderId": equipmentOrder.get("object")
				});
			}
		}

		if (mode == "save"){
			readTaskDetail(transferType + "~" + localTransferNumber);
		}
		else {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			sql = "select department, ";
			sql += "purchaseOrder ";
			sql += "from TransferHeader ";
			sql += "where localTransferNumber = ? ";
			var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

			if (department.length === 0){
				if (transferHeaderArray.length > 0){
					department = transferHeaderArray[0].department;
				}
			}
			if (purchaseOrder.length === 0){
				if (transferHeaderArray.length > 0){
					purchaseOrder = transferHeaderArray[0].purchaseOrder;
				}
			}

			readTaskDetail(transferType + "~" + localTransferNumber);
			$("#department").val(department);
			$("#description").val("");
			$("#equipmentOrderId").val("");
			$("#localEquipmentOrderId").val("");
			$("#localTransferNumber").val($("#taskHeaderContainer").attr("data-localTransferNumber"));
			$("#model").val("");
			$("#prefix").val("");
			$("#purchaseOrder").val(purchaseOrder);
			$("#quantityOrdered").val("1");
			$("#transferNumber").val($("#taskHeaderContainer").attr("data-transferNumber"));
			$("#vendor").val("");
			$("#object").val("");
		}
	}
	Rho.Log.info("End: saveEditOrderItem", "inMotion");
}

function displayRefusedDialog(resultArray, menu){
	Rho.Log.info("Start: displayRefusedDialog(" + resultArray + "," + menu + ")", "inMotion");

	var transferDetailObj;
	var transferDetailObjList = [];
	for (var i=0; i < resultArray.length; i++){
		transferDetailObj = {};
		transferDetailObj.prefix = resultArray[i].prefix;
		transferDetailObj.unit = resultArray[i].unit;
		transferDetailObj.itemDescription = resultArray[i].prefix + " "  + resultArray[i].unit + " " + resultArray[i].description;
		transferDetailObj.itemDescription2 = resultArray[i].department.substr(0, 20) + " " + resultArray[i].purchaseOrder.substr(0, 10) + " " + resultArray[i].patientName.substr(0, 20);
		transferDetailObjList.push(transferDetailObj);
	}

	var jsonObj = {};
	jsonObj.items = transferDetailObjList;

	$.get("/public/templates/refuseItem.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonObj);
		jsonObj = null;
		
		modal.open({
			content: templateWithData,
			fullScreen: true,
			enableScroll: true
		}, function(){
			var reasonRefused = $("#reasonRefused").val();
			var notes = $("#notes").val();
			var errMsgs = [];
			if (reasonRefused.length === 0) {
				errMsgs.push("Reason is required.\n" );
			}
			if (reasonRefused == "O" && notes.length === 0){
				errMsgs.push("Notes are required.\n" );
			}
			if (errMsgs.length !== 0) {
				alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
				return false;
			}
			else {
				saveRefusedItems();
			}
		});
		$("#selectAllItems").off("click");
		$("#selectAllItems").on("click", function(){
			$(".refuseList").attr("src", "images/uhs/checkbox-checked.png");
		});
		$("#deselectAllItems").off("click");
		$("#deselectAllItems").on("click", function(){
			$(".refuseList").attr("src", "images/uhs/checkbox-unchecked.png");
		});
		$(".refuseList").off("click");
		$(".refuseList").on("click", function(){
			var index = $(this).attr("data-index");
			toggleCheckbox("refuseList" + index);
		});
		$(".refuseContainerText").off("click");
		$(".refuseContainerText").on("click", function(){
			var index = $(this).attr("data-index");
			toggleCheckbox("refuseList" + index);
		});

		//if only 1 transfer detail mark it as selected
		if (resultArray.length == 1){
			$("#selectAllItems").click();
		}
	});
	Rho.Log.info("End: displayRefusedDialog", "inMotion");
}

function editOrderItem(prefix, department, purchaseOrder){
	Rho.Log.info("Start: editOrderItem(" + prefix + ", " + department + ", " + purchaseOrder + ")", "inMotion");

	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var transferNumber = $("#taskHeaderContainer").attr("data-transferNumber");

	var sqlExpression = [];
	sqlExpression[0] = localTransferNumber;
	sqlExpression[1] = prefix;
	sqlExpression[2] = department;
	sqlExpression[3] = purchaseOrder;

	var sql = "SELECT department, ";
	sql += "description, ";
	sql += "equipmentOrderId, ";
	sql += "localEquipmentOrderId, ";
	sql += "localTransferNumber, ";
	sql += "model, ";
	sql += "prefix, ";
	sql += "purchaseOrder, ";
	sql += "quantityOrdered, ";
	sql += "transferNumber, ";
	sql += "vendor, ";
	sql += "object ";
	sql += "from TransferEquipmentOrder ";
	sql += "where localTransferNumber = ? ";
	sql += "and prefix = ? ";
	sql += "and department = ? ";
	sql += "and purchaseOrder = ? ";
	var equipmentOrderArray = userDatabase.executeSql(sql, sqlExpression);

	var orderItem = {};
	if (equipmentOrderArray.length > 0) {
		//order item exists
		orderItem.department = equipmentOrderArray[0].department;
		orderItem.description = equipmentOrderArray[0].description;
		orderItem.equipmentOrderId = equipmentOrderArray[0].equipmentOrderId;
		orderItem.localEquipmentOrderId = equipmentOrderArray[0].localEquipmentOrderId;
		orderItem.localTransferNumber = equipmentOrderArray[0].localTransferNumber;
		orderItem.model = equipmentOrderArray[0].model;
		orderItem.prefix = equipmentOrderArray[0].prefix;
		orderItem.purchaseOrder = equipmentOrderArray[0].purchaseOrder;
		orderItem.quantityOrdered = equipmentOrderArray[0].quantityOrdered;
		orderItem.transferNumber = equipmentOrderArray[0].transferNumber;
		orderItem.vendor = equipmentOrderArray[0].vendor;
		orderItem.object = equipmentOrderArray[0].object;
	}
	else {
		sqlExpression = [];
		sqlExpression[0] = localTransferNumber;

		sql = "select department, ";
		sql += "purchaseOrder ";
		sql += "from TransferHeader ";
		sql += "where localTransferNumber = ? ";
		var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

		department = "";
		purchaseOrder = "";
		if (transferHeaderArray.length > 0){
			department = transferHeaderArray[0].department;
			purchaseOrder = transferHeaderArray[0].purchaseOrder;
		}

		//order item does not exist
		orderItem.department = department;
		orderItem.description = "";
		orderItem.equipmentOrderId = "";
		orderItem.localEquipmentOrderId = "";
		orderItem.localTransferNumber = localTransferNumber;
		orderItem.model = "";
		orderItem.prefix = "";
		orderItem.purchaseOrder = purchaseOrder;
		orderItem.quantityOrdered = 1;
		orderItem.transferNumber = transferNumber;
		orderItem.vendor = "";
	}

	$.get("/public/templates/editOrderItem.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(orderItem);
		orderItem = null;

		modal.open({
			content: templateWithData,
			fullScreen: false
		}, function(){
			saveEditOrderItem("save");
		});
		$("#saveNew").off("click");
		$("#saveNew").on("click", function(){
			saveEditOrderItem("saveNew");
		});
	});
	Rho.Log.info("End: editOrderItem", "inMotion");
}

function editTask(){
	Rho.Log.info("Start: editTask()", "inMotion");

	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var sqlExpression = [];
	sqlExpression[0] = localTransferNumber;

	var sql = "SELECT accountId, ";
	sql += "comment, ";
	sql += "cstat, ";
	sql += "deliveredByEmployeeId, ";
	sql += "deliveryDate, ";
	sql += "department, ";
	sql += "localSwapOutNumber, ";
	sql += "localTransferNumber, ";
	sql += "localUhsPatientId, ";
	sql += "orderBy, ";
	sql += "orderDate, ";
	sql += "postedByEmployeeId, ";
	sql += "purchaseOrder, ";
	sql += "status, ";
	sql += "swapOutFlag, ";
	sql += "swapOutNumber, ";
	sql += "telephoneNumber, ";
	sql += "transferDate, ";
	sql += "transferNumber, ";
	sql += "transferType, ";
	sql += "transferredByEmployeeId, ";
	sql += "uhsPatientId, ";
	sql += "object ";
	sql += "from TransferHeader ";
	sql += "where localTransferNumber = ? ";

	var taskArray = userDatabase.executeSql(sql, sqlExpression);

	var taskObj;
	if (taskArray.length > 0){
		taskObj = taskArray[0];
		if (taskArray[0].transferType == "D"){
			taskObj.modalTitle = "Edit Delivery";
		}
		else if (taskArray[0].transferType == "P"){
			taskObj.modalTitle = "Edit Pickup";
		}
		else {

		}
	}

	$.get("/public/templates/editTask.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(taskObj);
		taskObj = null;

		modal.open({
			content: templateWithData
		}, function(){
			var errMsgs = [];
			var telephoneNumber = $("#telephoneNumber").val();
			if(telephoneNumber.length === 0 || isNaN(telephoneNumber)){
				errMsgs.push( "Telephone is missing or not a valid number." );
			}
			else if (telephoneNumber < 0 || telephoneNumber > 9999999999){
				errMsgs.push( "Telephone is not in the range 0 to 9999999999." );
			}
			if (errMsgs.length !== 0) {
				alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
				return false;
			}
			else {
				saveTask();
			}
		});
		$('#swapOutFlag').val(taskArray[0].swapOutFlag);
		if (taskArray[0].transferType == 'P'){
			$('#swapOutFlag').attr("disabled", true);
		}
	});
	Rho.Log.info("End: editTask", "inMotion");
}

function editTaskPatient(){
	Rho.Log.info("Start: editTaskPatient()", "inMotion");

	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var accountId = $("#taskHeaderContainer").attr("data-accountId");

	var sqlExpression = [];
	sqlExpression[0] = localTransferNumber;

	var sql = "SELECT th.accountId, ";
	sql += "th.uhsPatientId, ";
	sql += "th.localUhsPatientId, ";
	sql += "p.additionalPatientId, ";
	sql += "p.deliveryLocation, ";
	sql += "p.firstName, ";
	sql += "p.hospitalPatientId, ";
	sql += "p.lastName, ";
	sql += "p.middleInitial, ";
	sql += "p.physiciansId, ";
	sql += "p.roomNumber, ";
	sql += "p.tradingPartnerId, ";
	sql += "p.object ";
	sql += "from TransferHeader th ";
	sql += "left outer join Patient p ";
	sql += "on th.localUhsPatientId = p.localUhsPatientId ";
	sql += "where localTransferNumber = ? ";

	var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

	var patientObj = {};
	if (transferHeaderArray.length > 0){
		if (transferHeaderArray[0].localUhsPatientId > 0){
			patientObj.uhsPatientId = transferHeaderArray[0].uhsPatientId;
			patientObj.localUhsPatientId = transferHeaderArray[0].localUhsPatientId;
			patientObj.accountId = transferHeaderArray[0].accountId;
			patientObj.firstName = transferHeaderArray[0].firstName;
			patientObj.middleInitial = transferHeaderArray[0].middleInitial;
			patientObj.lastName = transferHeaderArray[0].lastName;
			patientObj.hospitalPatientId = transferHeaderArray[0].hospitalPatientId;
			patientObj.roomNumber = transferHeaderArray[0].roomNumber;
			patientObj.deliveryLocation = transferHeaderArray[0].deliveryLocation;
			patientObj.physiciansId = transferHeaderArray[0].physiciansId;
			patientObj.additionalPatientId = transferHeaderArray[0].additionalPatientId;
			patientObj.tradingPartnerId = transferHeaderArray[0].tradingPartnerId;
			patientObj.object = transferHeaderArray[0].object;
		}
		else {
			patientObj.uhsPatientId = 0;
			patientObj.localUhsPatientId = 0;
			patientObj.accountId = accountId;
			patientObj.firstName = "";
			patientObj.middleInitial = "";
			patientObj.lastName = "";
			patientObj.hospitalPatientId = "";
			patientObj.roomNumber = "";
			patientObj.deliveryLocation = "";
			patientObj.physiciansId = "";
			patientObj.additionalPatientId = "";
			patientObj.tradingPartnerId = "";
		}
	}

	$.get("/public/templates/editPatient.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(patientObj);

		modal.open({
			content: templateWithData
		}, function(){
			var hospitalPatientId = $("#hospitalPatientId").val().toUpperCase();
			var lastName = $("#lastName").val().toUpperCase();
			var roomNumber = $("#roomNumber").val().toUpperCase();
			var errMsgs = [];
			if (hospitalPatientId.length === 0 && lastName.length === 0 && roomNumber.length === 0) {
				errMsgs.push("You must provide last name, room number, or hospital patient ID.\n" );
			}

			if (errMsgs.length !== 0) {
				alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
				return false;
			}
			else {
				saveEditTaskPatient();
			}
		});
	});

	Rho.Log.info("End: editTaskPatient", "inMotion");
}

function readTask(id){
	Rho.Log.info("Start: readTask(" + id + ")", "inMotion");
	var taskType = id.split("~")[0];
	var taskId = id.split("~")[1];
	var obj;

	if (taskType == "Find"){
		obj = {};
		obj.localTransferNumber = taskId;
		obj.transferType = taskType;
		obj.accountId = id.split("~")[2];

		$.get("/public/templates/findHeader.html", function(data){
			var template = Handlebars.compile(data);
			$("#headerListContent").html(template(obj));
			$( "#taskHeaderImageContainer" ).off("click");
			$( "#taskHeaderImageContainer" ).on( "click", function() {
				showMenu("right", "task");
			});
			readTaskDetail(id);
			obj = null;
			id = null;
		});
	}
	else {
		try {
			var sqlExpression = [];
			sqlExpression[0] = taskId;

			var sql = "select th.transferType, ";
			sql += "th.transferNumber, ";
			sql += "th.transferDate, ";
			sql += "th.localTransferNumber, ";
			sql += "th.accountId, ";
			sql += "case when th.orderDate = '0001-01-01 00:00:00.0' then th.orderDate else datetime(th.orderDate, 'localtime') end as orderDate, ";
			sql += "th.orderBy, ";
			sql += "th.telephoneNumber, ";
			sql += "th.department, ";
			sql += "th.purchaseOrder, ";
			sql += "th.uhsPatientId, ";
			sql += "th.localUhsPatientId, ";
			sql += "th.swapOutNumber, ";
			sql += "th.localSwapOutNumber, ";
			sql += "case when length(p.lastName) > 0 then p.lastName || case when length(p.firstName) > 0 then ', ' || p.firstName || ' ' || p.middleInitial else '' end || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end when length(p.hospitalPatientId) > 0 then p.hospitalPatientId || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end else trim(p.additionalPatientId) || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end end as patientName, ";
			sql += "a.hasUnitAccessoryTracking, ";
			sql += "td.scanLevel ";
			sql += "from transferHeader th ";
			sql += "left outer join patient p ";
			sql += "on th.localUhsPatientId = p.localUhsPatientId ";
			sql += "left outer join account a ";
			sql += "on th.accountId = a.accountId ";
			sql += "left outer join tripDetail td ";
			sql += "on th.localTransferNumber = td.localTaskReferenceId ";
			sql += "where th.localTransferNumber = ?";
			var taskList = userDatabase.executeSql(sql, sqlExpression);

			obj = {};
			if (taskList.length > 0) {
				if (taskList[0].transferNumber != 0){
					if (taskList[0].transferNumber.length > 9){
						obj.dspTransferNumber = taskList[0].transferNumber.substr(0,9) + "...";
					}
					else {
						obj.dspTransferNumber = taskList[0].transferNumber;
					}
				}
				else {
					if (taskList[0].localTransferNumber.length > 9){
						obj.dspTransferNumber = taskList[0].localTransferNumber.substr(0,9) + "...";
					}
					else {
						obj.dspTransferNumber = taskList[0].localTransferNumber;
					}
				}
				obj.transferNumber = taskList[0].transferNumber;
				obj.localTransferNumber = taskList[0].localTransferNumber;
				obj.transferDate = taskList[0].transferDate;
				obj.accountId = taskList[0].accountId;
				if (taskList[0].transferType == "D"){
					obj.transferType = "Delivery";
				}
				else if (taskList[0].transferType == "P"){
					obj.transferType = "Pickup";
				}
				else if (taskList[0].transferType == "F"){
					obj.transferType = "Find";
				}
				else {
					obj.transferType = "Unknown";
				}
				obj.orderBy = taskList[0].orderBy;
				obj.orderDate = taskList[0].orderDate;
				obj.telephoneNumber = taskList[0].telephoneNumber;
				if (taskList[0].department.length > 0){
					obj.department = "Dept: " + taskList[0].department;
				}
				if (taskList[0].purchaseOrder.length > 0){
					obj.purchaseOrder = "Po: " + taskList[0].purchaseOrder;
				}
				if (taskList[0].localUhsPatientId != 0){
					var patientName = taskList[0].patientName;
					if (patientName.length > 26){
						obj.patientName = "Pt: " + taskList[0].patientName.substr(0,26) + "...";
					}
					else if (patientName.length > 0){
						obj.patientName = "Pt: " + taskList[0].patientName;
					}
					else {

					}
				}
				obj.hasUnitAccessoryTracking = taskList[0].hasUnitAccessoryTracking;
				obj.scanLevel = taskList[0].scanLevel;
				obj.swapoutNumber = taskList[0].swapOutNumber;
				obj.localSwapoutNumber = taskList[0].localSwapOutNumber;
			}

			$.get("/public/templates/readTask.html", function(data){
				var template = Handlebars.compile(data);
				$("#headerListContent").html(template(obj));
				$( "#taskHeaderImageContainer" ).off("click");
				$( "#taskHeaderImageContainer" ).on( "click", function() {
					showMenu("right", "task");
				});
				readTaskDetail(id);
				obj = null;
				id = null;
			});
		}
		catch (e) {
			Rho.Log.info("Error: readTask(" + e.message + ")", "inMotion");
		}
	}
	Rho.Log.info("End: readTask", "inMotion");
}

function refuseSelectedItems(){
	Rho.Log.info("Start: refuseSelectedItems()", "inMotion");

	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");

	//get all transfer detail records
	//set sql parameter array
	var sqlExpression = [];
	sqlExpression[0] = localTransferNumber;

	var sql = "select td.cstat, ";
	sql += "td.department, ";
	sql += "td.description, ";
	sql += "td.employeeInitials, ";
	sql += "td.prefix, ";
	sql += "td.purchaseOrder, ";
	sql += "td.reasonRefused, ";
	sql += "td.refusedFlag, ";
	sql += "td.transferDate, ";
	sql += "td.transferNumber, ";
	sql += "td.uhsPatientId, ";
	sql += "td.unit, ";
	sql += "td.object, ";
	sql += "case when length(p.lastName) > 0 then p.lastName || case when length(p.firstName) > 0 then ', ' || p.firstName || ' ' || p.middleInitial else '' end || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end when length(p.hospitalPatientId) > 0 then p.hospitalPatientId || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end else trim(p.additionalPatientId) || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end end as patientName ";
	sql += "from TransferDetail td ";
	sql += "left outer join Patient p ";
	sql += "on td.localUhsPatientId = p.localUhsPatientId ";
	sql += "where localTransferNumber = ? ";
	sql += "and refusedFlag = '' ";
	var resultArray = userDatabase.executeSql(sql, sqlExpression);

	displayRefusedDialog(resultArray, "task");
	Rho.Log.info("End: refuseSelectedItems", "inMotion");
}

function removeTask(){
	Rho.Log.info("Start: removeTask()", "inMotion");
	//TODO need to delete accessories if they have been created
	var msg = confirm("You are about to remove this task and all its related records from this trip. \n\n Continue?");
	if (msg === true){
		userDatabase.startTransaction();
		try	{
			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var hasUnitAccessoryTracking = $("#taskHeaderContainer").attr("data-hasUnitAccessoryTracking");
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
			var i;
			var sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			var commentInstance;
			var tripDetailInstance;

			var sql = "select th.accountId, ";
			sql += "th.comment, ";
			sql += "th.cstat, ";
			sql += "th.deliveredByEmployeeId, ";
			sql += "th.deliveryDate, ";
			sql += "th.department, ";
			sql += "th.localSwapOutNumber, ";
			sql += "th.localTransferNumber, ";
			sql += "th.localUhsPatientId, ";
			sql += "th.orderBy, ";
			sql += "th.orderDate, ";
			sql += "th.postedByEmployeeId, ";
			sql += "th.purchaseOrder, ";
			sql += "th.status, ";
			sql += "th.swapOutFlag, ";
			sql += "th.swapOutNumber, ";
			sql += "th.telephoneNumber, ";
			sql += "th.transferDate, ";
			sql += "th.transferNumber, ";
			sql += "th.transferType, ";
			sql += "th.transferredByEmployeeId, ";
			sql += "th.uhsPatientId, ";
			sql += "th.object as transferHeaderObject, ";
			sql += "td.cstat, ";
			sql += "td.department, ";
			sql += "td.description, ";
			sql += "td.employeeId, ";
			sql += "td.employeeInitials, ";
			sql += "td.localTransferDetailId, ";
			sql += "td.localTransferNumber, ";
			sql += "td.localUhsPatientId, ";
			sql += "td.model, ";
			sql += "td.prefix, ";
			sql += "td.purchaseOrder, ";
			sql += "td.reasonRefused, ";
			sql += "td.refusedFlag, ";
			sql += "td.scanOffDate, ";
			sql += "td.scanOnDate, ";
			sql += "td.transferDate, ";
			sql += "td.transferDetailId, ";
			sql += "td.transferNumber, ";
			sql += "td.uhsPatientId, ";
			sql += "td.unit, ";
			sql += "td.vendor, ";
			sql += "td.object as transferDetailObject, ";
			sql += "trd.accountId, ";
			sql += "trd.employeeId, ";
			sql += "trd.localTaskReferenceId, ";
			sql += "trd.localTripDetailId, ";
			sql += "trd.localTripId, ";
			sql += "trd.scanLevel, ";
			sql += "trd.taskReferenceId, ";
			sql += "trd.taskType, ";
			sql += "trd.tripDetailId, ";
			sql += "trd.tripId, ";
			sql += "trd.object as tripDetailObject, ";
			sql += "tc.comment, ";
			sql += "tc.commentDate, ";
			sql += "tc.employeeId, ";
			sql += "tc.localTransferCommentId, ";
			sql += "tc.localTransferNumber, ";
			sql += "tc.prefix, ";
			sql += "tc.transferCommentId, ";
			sql += "tc.transferNumber, ";
			sql += "tc.unit, ";
			sql += "tc.object as transferCommentObject ";
			sql += "from TransferDetail td ";
			sql += "inner join TransferHeader th ";
			sql += "on td.localTransferNumber = th.localTransferNumber ";
			sql += "inner join ( ";
			sql += "SELECT prefix, unit ";
			sql += "FROM TransferDetail ";
			sql += "where localTransferNumber = ? ";
			sql += "and refusedFlag = 'Y') del ";
			sql += "on td.prefix = del.prefix ";
			sql += "and td.unit = del.unit ";
			sql += "inner join TripDetail trd ";
			sql += "on th.localTransferNumber = trd.localTaskReferenceId ";
			sql += "left outer join TransferComment tc ";
			sql += "on td.localTransferNumber = tc.localTransferNumber ";
			sql += "and td.prefix = tc.prefix ";
			sql += "and td.unit = tc.unit ";
			sql += "where th.transferType = 'P' ";
			sql += "and  th.status = 'C' ";
			sql += "and refusedFlag = 'Y' ";
			var refusalList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < refusalList.length; i++){
				var refusalPickupInstance = transferHeaderModel.make({
					"accountId": refusalList[i].accountId,
					"comment": refusalList[i].comment,
					"cstat": refusalList[i].cstat,
					"deliveredByEmployeeId": refusalList[i].deliveredByEmployeeId,
					"deliveryDate": refusalList[i].deliveryDate,
					"department": refusalList[i].department,
					"localSwapOutNumber": refusalList[i].localSwapOutNumber,
					"localTransferNumber": refusalList[i].localTransferNumber,
					"localUhsPatientId": refusalList[i].localUhsPatientId,
					"orderBy": refusalList[i].orderBy,
					"orderDate": refusalList[i].orderDate,
					"postedByEmployeeId": refusalList[i].postedByEmployeeId,
					"purchaseOrder": refusalList[i].purchaseOrder,
					"status": refusalList[i].status,
					"swapOutFlag": refusalList[i].swapOutFlag,
					"swapOutNumber": refusalList[i].swapOutNumber,
					"telephoneNumber": refusalList[i].telephoneNumber,
					"transferDate": refusalList[i].transferDate,
					"transferNumber": refusalList[i].transferNumber,
					"transferType": refusalList[i].transferType,
					"transferredByEmployeeId": refusalList[i].transferredByEmployeeId,
					"uhsPatientId": refusalList[i].uhsPatientId,
					"employeeId": currentEmployeeId,
					"object": refusalList[i].transferHeaderObject
				});

				refusalPickupInstance.destroy();

				var refusalPickupDetailInstance = transferDetailModel.make({
					"cstat": refusalList[i].cstat,
					"department": refusalList[i].department,
					"description": refusalList[i].description,
					"employeeId": refusalList[i].employeeId,
					"employeeInitials": refusalList[i].employeeInitials,
					"localTransferDetailId": refusalList[i].localTransferDetailId,
					"localTransferNumber": refusalList[i].localTransferNumber,
					"localUhsPatientId": refusalList[i].localUhsPatientId,
					"model": refusalList[i].model,
					"prefix": refusalList[i].prefix,
					"purchaseOrder": refusalList[i].purchaseOrder,
					"reasonRefused": refusalList[i].reasonRefused,
					"refusedFlag": refusalList[i].refusedFlag,
					"scanOffDate": refusalList[i].scanOffDate,
					"scanOnDate": refusalList[i].scanOnDate,
					"transferDate": refusalList[i].transferDate,
					"transferDetailId": refusalList[i].transferDetailId,
					"transferNumber": refusalList[i].transferNumber,
					"uhsPatientId": refusalList[i].uhsPatientId,
					"unit": refusalList[i].unit,
					"vendor": refusalList[i].vendor,
					"object": refusalList[i].transferDetailObject
				});

				refusalPickupDetailInstance.destroy();

				//remove any refusal transfer comment on the pickup
				commentInstance = transferCommentModel.make({
					"comment": refusalList[i].comment,
					"commentDate": refusalList[i].commentDate,
					"employeeId": refusalList[i].employeeId,
					"localTransferCommentId": refusalList[i].localTransferCommentId,
					"localTransferNumber": refusalList[i].localTransferNumber,
					"prefix": refusalList[i].prefix,
					"transferCommentId": refusalList[i].transferCommentId,
					"transferNumber": refusalList[i].transerNumber,
					"unit": refusalList[i].unit,
					"object": refusalList[i].transferCommentObject
				});

				commentInstance.destroy();

				//remove any tripDetail records associated with the pickup
				tripDetailInstance = tripDetailModel.make({
					"accountId": refusalList[i].accountId,
					"employeeId": refusalList[i].employeeId,
					"localTaskReferenceId": refusalList[i].localTaskReferenceId,
					"localTripDetailId": refusalList[i].localTripDetailId,
					"localTripId": refusalList[i].localTripId,
					"scanLevel": refusalList[i].scanLevel,
					"taskReferenceId": refusalList[i].taskReferenceId,
					"taskType": refusalList[i].taskType,
					"tripDetailId": refusalList[i].tripDetailId,
					"tripId": refusalList[i].tripId,
					"object": refusalList[i].tripDetailObject
				});

				tripDetailInstance.destroy();
			}

			//remove any refusal transfer comments on the delivery
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			sql = "select comment, ";
			sql += "commentDate, ";
			sql += "employeeId, ";
			sql += "localTransferCommentId, ";
			sql += "localTransferNumber, ";
			sql += "prefix, ";
			sql += "transferCommentId, ";
			sql += "transferNumber, ";
			sql += "unit, ";
			sql += "object ";
			sql += "from TransferComment ";
			sql += "where localTransferNumber = ? ";
			var commentList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < commentList.length; i++){
				commentInstance = transferCommentModel.make({
					"comment": commentList[i].comment,
					"commentDate": commentList[i].commentDate,
					"employeeId": commentList[i].employeeId,
					"localTransferCommentId": commentList[i].localTransferCommentId,
					"localTransferNumber": commentList[i].localTransferNumber,
					"prefix": commentList[i].prefix,
					"transferCommentId": commentList[i].transferCommentId,
					"transferNumber": commentList[i].transerNumber,
					"unit": commentList[i].unit,
					"object": commentList[i].object
				});

				commentInstance.destroy();
			}

			//delete transferDetail records for this transfer
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			sql = "select accountId, ";
			sql += "localTaskReferenceId, ";
			sql += "localTripDetailId, ";
			sql += "localTripId, ";
			sql += "taskReferenceId, ";
			sql += "taskType, ";
			sql += "tripDetailId, ";
			sql += "tripId, ";
			sql += "employeeId, ";
			sql += "scanLevel, ";
			sql += "object ";
			sql += "from tripDetail ";
			sql += "where localTaskReferenceId = ?";
			var tripDetailList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < tripDetailList.length; i++){
				tripDetailInstance = tripDetailModel.make({
					"accountId": tripDetailList[i].accountId,
					"localTaskReferenceId": tripDetailList[i].localTaskReferenceId,
					"localTripDetailId": tripDetailList[i].localTripDetailId,
					"localTripId": tripDetailList[i].localTripId,
					"taskReferenceId": tripDetailList[i].taskReferenceId,
					"taskType": tripDetailList[i].taskType,
					"tripDetailId": tripDetailList[i].tripDetailId,
					"tripId": tripDetailList[i].tripId,
					"employeeId": tripDetailList[i].employeeId,
					"scanLevel": tripDetailList[i].scanLevel,
					"object": tripDetailList[i].object
				});

				tripDetailInstance.destroy();
			}

			sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeInitials ";
			sql += "localTransferDetailId, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
			sql += "prefix, ";
			sql += "purchaseOrder, ";
			sql += "reasonRefused, ";
			sql += "refusedFlag, ";
			sql += "scanOffDate, ";
			sql += "scanOnDate, ";
			sql += "transferDate, ";
			sql += "transferDetailId, ";
			sql += "transferNumber, ";
			sql += "uhsPatientId, ";
			sql += "unit, ";
			sql += "employeeId, ";
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ?";
			var transferDetailList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < transferDetailList.length; i++){
				var transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailList[i].cstat,
					"department": transferDetailList[i].department,
					"description": transferDetailList[i].description,
					"employeeInitials": transferDetailList[i].employeeInitials,
					"localTransferDetailId" : transferDetailList[i].localTransferDetailId,
					"localTransferNumber": transferDetailList[i].localTransferNumber,
					"localUhsPatientId": transferDetailList[i].localUhsPatientId,
					"prefix": transferDetailList[i].prefix,
					"purchaseOrder": transferDetailList[i].purchaseOrder,
					"reasonRefused": transferDetailList[i].reasonRefused,
					"refusedFlag": transferDetailList[i].refusedFlag,
					"scanOffDate": transferDetailList[i].scanOffDate,
					"scanOnDate": transferDetailList[i].scanOnDate,
					"transferDate": transferDetailList[i].transferDate,
					"transferDetailId": transferDetailList[i].transferDetailId,
					"transferNumber": transferDetailList[i].transferNumber,
					"uhsPatientId": transferDetailList[i].uhsPatientId,
					"unit": transferDetailList[i].unit,
					"employeeId": transferDetailList[i].employeeId,
					"object": transferDetailList[i].object,
				});

				transferDetailInstance.destroy();
			}

			//find all accessories
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			var accessoriesList;
			var accessoryInstance;

			if (hasUnitAccessoryTracking == 0){
				sql = "select accessory, ";
				sql += "employeeId, ";
				sql += "localTransferNumber, ";
				sql += "localTransferPrefixId, ";
				sql += "prefix, ";
				sql += "quantity, ";
				sql += "transferNumber, ";
				sql += "transferPrefixId, ";
				sql += "object ";
				sql += "from TransferredPrefixAccessories ";
				sql += "where localTransferNumber = ?";
				accessoriesList = userDatabase.executeSql(sql, sqlExpression);

				for (i = 0; i < accessoriesList.length; i++){
					accessoryInstance = transferredPrefixAccessoriesModel.make({
						"accessory": accessoriesList[i].accessory,
						"employeeId": accessoriesList[i].employeeId,
						"localTransferNumber": accessoriesList[i].localTransferNumber,
						"localTransferPrefixId": accessoriesList[i].localTransferPrefixId,
						"prefix": accessoriesList[i].prefix,
						"quantity": accessoriesList[i].quantity,
						"transferNumber": accessoriesList[i].transferNumber,
						"transferPrefixId": accessoriesList[i].transferPrefixId,
						"object": accessoriesList[i].object
					});

					accessoryInstance.destroy();
				}

			}
			else {
				sql = "select accessoryIsDamaged, ";
				sql += "accessoryIsLost, ";
				sql += "accessoryTransferId, ";
				sql += "employeeId, ";
				sql += "localAccessoryTransferId, ";
				sql += "employeeId, ";
				sql += "localAccessoryTransferId, ";
				sql += "localMatchingAccessoryTransferId, ";
				sql += "localTransferNumber, ";
				sql += "lostReportUserId, ";
				sql += "lostStatusDate, ";
				sql += "matchingAccessoryTransferId, ";
				sql += "outOfStock, ";
				sql += "prefix, ";
				sql += "stockNumber, ";
				sql += "substitutedStockNumber, ";
				sql += "transferDate, ";
				sql += "transferNumber, ";
				sql += "transferType, ";
				sql += "unit, ";
				sql += "object ";
				sql += "from TransferredUnitAccessories ";
				sql += "where localTransferNumber = ?";
				accessoriesList = userDatabase.executeSql(sql, sqlExpression);

				for (i = 0; i < accessoriesList.length; i++){
					sqlExpression = [];
					sqlExpression[0] = accessoriesList[i].localAccessoryTransferId;

					sql = "select customerDepartment, ";
					sql += "deliveryAccessoryTransferId, ";
					sql += "employeeId, ";
					sql += "localDeliveryAccessoryTransferId, ";
					sql += "localRetrievalAccessoryTransferId, ";
					sql += "localSurplusId, ";
					sql += "matchDate, ";
					sql += "matchUserId, ";
					sql += "retrievalAccessoryTransferId, ";
					sql += "surplusId, ";
					sql += "object ";
					sql += "from SurplusRetrievedAccessories ";
					sql += "where localRetrievalAccessoryTransferId = ? ";
					var surplusList = userDatabase.executeSql(sql, sqlExpression);

					//delete surplusRetrievedAccessories
					for (var m=0; m < surplusList.length; m++){
						var surplusInstance = surplusRetrievedAccessoriesModel.make({
							"customerDepartment": surplusList[m].customerDepartment,
							"deliveryAccessoryTransferId": surplusList[m].deliveryAccessoryTransferId,
							"employeeId": surplusList[m].employeeId,
							"localDeliveryAccessoryTransferId": surplusList[m].localDeliveryAccessoryTransferId,
							"localRetrievalAccessoryTransferId": surplusList[m].localRetrievalAccessoryTransferId,
							"localSurplusId": surplusList[m].localSurplusId,
							"matchDate": surplusList[m].matchDate,
							"matchUserId": surplusList[m].matchUserId,
							"retrievalAccessoryTransferId": surplusList[m].retrievalAccessoryTransferId,
							"surplusId": surplusList[m].surplusId,
							"object": surplusList[m].object
						});

						surplusInstance.destroy();
					}

					//delete transferredUnitAccessories
					accessoryInstance = transferredUnitAccessoriesModel.make({
						"accessoryIsDamaged": accessoriesList[i].accessoryIsDamaged,
						"accessoryIsLost": accessoriesList[i].accessoryIsLost,
						"accessoryTransferId": accessoriesList[i].accessoryTransferId,
						"employeeId": accessoriesList[i].employeeId,
						"localAccessoryTransferId": accessoriesList[i].localAccessoryTransferId,
						"localMatchingAccessoryTransferId": accessoriesList[i].localMatchingAccessoryTransferId,
						"localTransferNumber": accessoriesList[i].localTansferNumber,
						"lostReportUserId": accessoriesList[i].lostReportUserId,
						"lostStatusId": accessoriesList[i].lostStatusId,
						"matchingAccessoryTransferId": accessoriesList[i].matchingAccessoryTransferId,
						"outOfStock": accessoriesList[i].outOfStock,
						"prefix": accessoriesList[i].prefix,
						"stockNumber": accessoriesList[i].stockNumber,
						"substituteStockNumber": accessoriesList[i].substituteStockNumber,
						"transferDate": accessoriesList[i].transferDate,
						"transferNumber": accessoriesList[i].transferNumber,
						"transferType": accessoriesList[i].transferType,
						"unit": accessoriesList[i].unit,
						"object": accessoriesList[i].object,
					});

					accessoryInstance.destroy();
				}

			}

			//TODO Remove damaged item detail records
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			sql = "select base64Image ";
			sql += "damagedItemDetailId, ";
			sql += "damagedItemId, ";
			sql += "employeeId, ";
			sql += "localDamagedItemDetailId, ";
			sql += "localDamagedItemId, ";
			sql += "object ";
			sql += "from DamagedItemDetail ";
			sql += "where localDamagedItemId in ( ";
			sql += "select localDamagedItemId ";
			sql += "from DamagedItem ";
			sql += "where localTransferNumber = ? ";
			sql += ")";
			var damagedItemDetailList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < damagedItemDetailList.length; i++){
				var damagedItemDetailInstance = damagedItemDetailModel.make({
					"base64Image": damagedItemDetailList[i].base64Image,
					"damagedItemDetailId": damagedItemDetailList[i].damagedItemDetailId,
					"damagedItem": damagedItemDetailList[i].damagedItem,
					"employeeId": damagedItemDetailList[i].employeeId,
					"localDamagedItemDetailId": damagedItemDetailList[i].localDamagedItemDetailId,
					"localDamagedItemId": damagedItemDetailList[i].localDamagedItemId,
					"object": damagedItemDetailList[i].object
				});

				damagedItemDetailInstance.destroy();
			}

			//TODO Remove damaged item records
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			sql = "select accessoryMissing ";
			sql += "customerReportedFailure, ";
			sql += "damagedItemDate, ";
			sql += "damagedItemId, ";
			sql += "employeeId, ";
			sql += "localDamagedItemId, ";
			sql += "localTransferNumber, ";
			sql += "localTripId, ";
			sql += "notes, ";
			sql += "transferNumber, ";
			sql += "tripId, ";
			sql += "unit, ";
			sql += "visibleDamage, ";
			sql += "object ";
			sql += "from DamagedItem ";
			sql += "where localTransferNumber = ? ";
			var damagedItemList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < damagedItemList.length; i++){
				var damagedItemInstance = damagedItemModel.make({
					"accessoryMissing": damagedItemList[i].accessoryMissing,
					"customerReportedFailure": damagedItemList[i].customerReportedFailure,
					"damagedItemDate": damagedItemList[i].damagedItemDate,
					"damagedItemId": damagedItemList[i].damagedItemId,
					"employeeId": damagedItemList[i].employeeId,
					"localDamagedItemId": damagedItemList[i].localDamagedItemId,
					"localTransferNumber": damagedItemList[i].localTransferNumber,
					"localTripId": damagedItemList[i].localTripId,
					"notes": damagedItemList[i].notes,
					"otherDamage": damagedItemList[i].otherDamage,
					"prefix": damagedItemList[i].prefix,
					"transferNumber": damagedItemList[i].transferNumber,
					"tripId": damagedItemList[i].tripId,
					"unit": damagedItemList[i].unit,
					"visibleDamage": damagedItemList[i].visibleDamage,
					"object": damagedItemList[i].object
				});

				damagedItemInstance.destroy();
			}

			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			sql = "select deliveryPrefix ";
			sql += "deliveryTransferNumber, ";
			sql += "deliveryUnit, ";
			sql += "employeeId, ";
			sql += "enterDate, ";
			sql += "enteredBy, ";
			sql += "entryMethod, ";
			sql += "localDeliveryTransferNumber, ";
			sql += "localPickupTransferNumber, ";
			sql += "localSwapoutId, ";
			sql += "pickupPrefix, ";
			sql += "pickupTransferNumber, ";
			sql += "pickupUnit, ";
			sql += "swapoutId, ";
			sql += "object ";
			sql += "from TransferSwapout ";
			sql += "where localPickupTransferNumber = ? ";

			var swapoutList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < swapoutList.length; i++){
				var swapoutInstance = transferSwapoutModel.make({
					"deliveryPrefix": swapoutList[i].deliveryPrefix,
					"deliveryTransferNumber": swapoutList[i].deliveryTransferNumber,
					"deliveryUnit": swapoutList[i].deliveryUnit,
					"employeeId": swapoutList[i].employeeId,
					"enterDate": swapoutList[i].enterDate,
					"enteredBy": swapoutList[i].enteredBy,
					"entryMethod": swapoutList[i].entryMethod,
					"localDeliveryTransferNumber": swapoutList[i].localDeliveryTransferNumber,
					"localPickupTransferNumber": swapoutList[i].localPickupTransferNumber,
					"localSwapoutId": swapoutList[i].localSwapoutId,
					"pickupPrefix": swapoutList[i].pickupPrefix,
					"pickupTransferNumber": swapoutList[i].pickupTransferNumber,
					"pickupUnit": swapoutList[i].pickupUnit,
					"swapoutId": swapoutList[i].swapoutId,
					"object": swapoutList[i].object
				});

				swapoutInstance.destroy();
			}

			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			//set transfer header back to held status
			sql = "select accountId, ";
			sql += "comment, ";
			sql += "cstat, ";
			sql += "deliveredByEmployeeId, ";
			sql += "deliveryDate, ";
			sql += "department, ";
			sql += "localSwapOutNumber, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
			sql += "orderBy, ";
			sql += "orderDate, ";
			sql += "purchaseOrder, ";
			sql += "status, ";
			sql += "swapOutFlag, ";
			sql += "swapOutNumber, ";
			sql += "telephoneNumber, ";
			sql += "transferDate, ";
			sql += "transferNumber, ";
			sql += "transferType, ";
			sql += "transferredByEmployeeId, ";
			sql += "uhsPatientId, ";
			sql += "object ";
			sql += "from transferHeader ";
			sql += "where localTransferNumber = ?";
			var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

			var transferHeaderInstance = transferHeaderModel.make({
				"accountId": transferHeaderArray[0].accountId,
				"comment": transferHeaderArray[0].comment,
				"cstat": transferHeaderArray[0].cstat,
				"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
				"deliveryDate": transferHeaderArray[0].deliveryDate,
				"department": transferHeaderArray[0].department,
				"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
				"localTransferNumber": transferHeaderArray[0].localTransferNumber,
				"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
				"orderBy": transferHeaderArray[0].orderBy,
				"orderDate": transferHeaderArray[0].orderDate,
				"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
				"purchaseOrder": transferHeaderArray[0].purchaseOrder,
				"status": "H",
				"swapOutFlag": transferHeaderArray[0].swapOutFlag,
				"swapOutNumber": transferHeaderArray[0].swapOutNumber,
				"telephoneNumber": transferHeaderArray[0].telephoneNumber,
				"transferDate": transferHeaderArray[0].transferDate,
				"transferNumber": transferHeaderArray[0].transferNumber,
				"transferType": transferHeaderArray[0].transferType,
				"transferredByEmployeeId": transferHeaderArray[0].transferredByEmployeeId,
				"uhsPatientId": transferHeaderArray[0].uhsPatientId,
				"employeeId": currentEmployeeId,
				"object": transferHeaderArray[0].object
			});
			transferHeaderInstance.save();
			userDatabase.commitTransaction();
			readTripDetail();
			$("#headerListContent").empty();
			$("#frameListContent").empty();
			hideMenu();
		}
		catch (e) {
			Rho.Log.info("Error: removeTask(" + e.message + ") - rolled back", "inMotion");
			userDatabase.rollbackTransaction();
		}
		finally {
			Rho.Log.info("End: removeTask", "inMotion");
		}
	}
}

function removeTaskPatient(){
	Rho.Log.info("Start: removeTaskPatient()", "inMotion");

	var msg = confirm("You are about to remove the patient from this task and all its related records. \n\n Continue?");
	if (msg === true){
		//wrap in try catch with commit and rollback
		userDatabase.startTransaction();
		try {
			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var transferType = $("#taskHeaderContainer").attr("data-transferType");
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
			var i;
			var sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			var sql = "select accountId, ";
			sql += "comment, ";
			sql += "cstat, ";
			sql += "deliveredByEmployeeId, ";
			sql += "deliveryDate, ";
			sql += "department, ";
			sql += "localSwapOutNumber, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
			sql += "orderBy, ";
			sql += "orderDate, ";
			sql += "postedByEmployeeId, ";
			sql += "purchaseOrder, ";
			sql += "status, ";
			sql += "swapOutFlag, ";
			sql += "swapOutNumber, ";
			sql += "telephoneNumber, ";
			sql += "transferDate, ";
			sql += "transferNumber, ";
			sql += "transferType, ";
			sql += "transferredByEmployeeId, ";
			sql += "uhsPatientId, ";
			sql += "object ";
			sql += "from transferHeader ";
			sql += "where localTransferNumber = ?";
			var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

			var transferHeaderInstance = transferHeaderModel.make({
				"accountId": transferHeaderArray[0].accountId,
				"comment": transferHeaderArray[0].comment,
				"cstat": transferHeaderArray[0].cstat,
				"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
				"deliveryDate": transferHeaderArray[0].deliveryDate,
				"department": transferHeaderArray[0].department,
				"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
				"localTransferNumber": transferHeaderArray[0].localTransferNumber,
				"localUhsPatientId": 0,
				"orderBy": transferHeaderArray[0].orderBy,
				"orderDate": transferHeaderArray[0].orderDate,
				"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
				"purchaseOrder": transferHeaderArray[0].purchaseOrder,
				"status": transferHeaderArray[0].status,
				"swapOutFlag": transferHeaderArray[0].swapOutFlag,
				"swapOutNumber": transferHeaderArray[0].swapOutNumber,
				"telephoneNumber": transferHeaderArray[0].telephoneNumber,
				"transferDate": transferHeaderArray[0].transferDate,
				"transferNumber": transferHeaderArray[0].transferNumber,
				"transferType": transferHeaderArray[0].transferType,
				"transferredByEmployeeId": transferHeaderArray[0].transferredByEmployeeId,
				"uhsPatientId": 0,
				"employeeId": currentEmployeeId,
				"object": transferHeaderArray[0].object
			});

			transferHeaderInstance.save();

			sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeInitials, ";
			sql += "localTransferDetailId, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
			sql += "prefix, ";
			sql += "purchaseOrder, ";
			sql += "reasonRefused, ";
			sql += "refusedFlag, ";
			sql += "scanOffDate, ";
			sql += "scanOnDate, ";
			sql += "transferDate, ";
			sql += "transferDetailId, ";
			sql += "transferNumber, ";
			sql += "uhsPatientId, ";
			sql += "unit, ";
			sql += "employeeId, ";
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

			var transferDetailInstance;
			for (i = 0; i < transferDetailArray.length; i++){
				transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailArray[i].cstat,
					"department": transferDetailArray[i].department,
					"description": transferDetailArray[i].description,
					"employeeInitials": transferDetailArray[i].employeeInitials,
					"localTransferDetailId": transferDetailArray[i].localTransferDetailId,
					"localTransferNumber": transferDetailArray[i].localTransferNumber,
					"localUhsPatientId": 0,
					"prefix": transferDetailArray[i].prefix,
					"purchaseOrder": transferDetailArray[i].purchaseOrder,
					"reasonRefused": transferDetailArray[i].reasonRefused,
					"refusedFlag": transferDetailArray[i].refusedFlag,
					"scanOffDate": transferDetailArray[i].scanOffDate,
					"scanOnDate": transferDetailArray[i].scanOnDate,
					"transferDate": transferDetailArray[i].transferDate,
					"transferDetailId": transferDetailArray[i].transferDetailId,
					"transferNumber": transferDetailArray[i].transferNumber,
					"uhsPatientId": 0,
					"unit": transferDetailArray[i].unit,
					"employeeId": transferDetailArray[i].employeeId,
					"object": transferDetailArray[i].object
				});
				transferDetailInstance.save();
			}
			userDatabase.commitTransaction();
			readTask(transferType + "~" + localTransferNumber);
			hideMenu();
		}
		catch(e) {
			Rho.Log.info("Error: addTransfersForAccount rollback=" + e, "inMotion");
			userDatabase.rollbackTransaction();
		}
		finally {
			Rho.Log.info("End: removeTaskPatient", "inMotion");
		}
	}
}

function saveAssignTaskPatient(){
	Rho.Log.info("Start: assignPatientToTask()", "inMotion");

	//Get selected uhsPatientId
	if ($(".patientList[src='images/uhs/radiobutton-checked.png']").length > 0){
		$(".patientList[src='images/uhs/radiobutton-checked.png']").each(function(){
			var localUhsPatientId = $(this).attr("data-localUhsPatientId");
			var uhsPatientId = $(this).attr("data-uhsPatientId");

			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var transferType = $("#taskHeaderContainer").attr("data-transferType");
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
			var sqlExpression = [];
			sqlExpression[0] = localTransferNumber;

			var sql = "select accountId, ";
			sql += "comment, ";
			sql += "cstat, ";
			sql += "deliveredByEmployeeId, ";
			sql += "deliveryDate, ";
			sql += "department, ";
			sql += "localSwapOutNumber, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
			sql += "orderBy, ";
			sql += "orderDate, ";
			sql += "postedByEmployeeId, ";
			sql += "purchaseOrder, ";
			sql += "status, ";
			sql += "swapOutFlag, ";
			sql += "swapOutNumber, ";
			sql += "telephoneNumber, ";
			sql += "transferDate, ";
			sql += "transferNumber, ";
			sql += "transferType, ";
			sql += "transferredByEmployeeId, ";
			sql += "uhsPatientId, ";
			sql += "object ";
			sql += "from transferHeader ";
			sql += "where localTransferNumber = ?";
			var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

			var transferHeaderInstance = transferHeaderModel.make({
				"accountId": transferHeaderArray[0].accountId,
				"comment": transferHeaderArray[0].comment,
				"cstat": transferHeaderArray[0].cstat,
				"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
				"deliveryDate": transferHeaderArray[0].deliveryDate,
				"department": transferHeaderArray[0].department,
				"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
				"localTransferNumber": transferHeaderArray[0].localTransferNumber,
				"localUhsPatientId": localUhsPatientId,
				"orderBy": transferHeaderArray[0].orderBy,
				"orderDate": transferHeaderArray[0].orderDate,
				"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
				"purchaseOrder": transferHeaderArray[0].purchaseOrder,
				"status": transferHeaderArray[0].status,
				"swapOutFlag": transferHeaderArray[0].swapOutFlag,
				"swapOutNumber": transferHeaderArray[0].swapOutNumber,
				"telephoneNumber": transferHeaderArray[0].telephoneNumber,
				"transferDate": transferHeaderArray[0].transferDate,
				"transferNumber": transferHeaderArray[0].transferNumber,
				"transferType": transferHeaderArray[0].transferType,
				"transferredByEmployeeId": transferHeaderArray[0].transferredByEmployeeId,
				"uhsPatientId": uhsPatientId,
				"employeeId": currentEmployeeId,
				"object": transferHeaderArray[0].object
			});
			transferHeaderInstance.save();

			sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeInitials, ";
			sql += "localTransferDetailId, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
			sql += "prefix, ";
			sql += "purchaseOrder, ";
			sql += "reasonRefused, ";
			sql += "refusedFlag, ";
			sql += "scanOffDate, ";
			sql += "scanOnDate, ";
			sql += "transferDate, ";
			sql += "transferDetailId, ";
			sql += "transferNumber, ";
			sql += "uhsPatientId, ";
			sql += "unit, ";
			sql += "employeeId, ";
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

			var transferDetailInstance;
			for (var i=0; i < transferDetailArray.length; i++){
				transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailArray[i].cstat,
					"department": transferDetailArray[i].department,
					"description": transferDetailArray[i].description,
					"employeeInitials": transferDetailArray[i].employeeInitials,
					"localTransferDetailId": transferDetailArray[i].localTransferDetailId,
					"localTransferNumber": transferDetailArray[i].localTransferNumber,
					"localUhsPatientId": localUhsPatientId,
					"prefix": transferDetailArray[i].prefix,
					"purchaseOrder": transferDetailArray[i].purchaseOrder,
					"reasonRefused": transferDetailArray[i].reasonRefused,
					"refusedFlag": transferDetailArray[i].refusedFlag,
					"scanOffDate": transferDetailArray[i].scanOffDate,
					"scanOnDate": transferDetailArray[i].scanOnDate,
					"transferDate": transferDetailArray[i].transferDate,
					"transferDetailId": transferDetailArray[i].transferDetailId,
					"transferNumber": transferDetailArray[i].transferNumber,
					"uhsPatientId": uhsPatientId,
					"unit": transferDetailArray[i].unit,
					"employeeId": transferDetailArray[i].employeeId,
					"object": transferDetailArray[i].object
				});

				transferDetailInstance.save();
			}

			readTask(transferType + "~" + localTransferNumber);
		});
	}
	else {
		alert("No patient has been selected");
		return false;
	}
	Rho.Log.info("End: assignPatientToTask", "inMotion");
}

function saveEditTaskPatient(){
	Rho.Log.info("Start: saveTaskPatient()", "inMotion");
	var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var transferType = $("#taskHeaderContainer").attr("data-transferType");
	var uhsPatientId = $("#uhsPatientId").val();
	var localUhsPatientId = $("#localUhsPatientId").val();
	var accountId = $("#accountId").val();
	var firstName = $("#firstName").val();
	var middleInitial = $("#middleInitial").val();
	var lastName = $("#lastName").val();
	var hospitalPatientId = $("#hospitalPatientId").val();
	var roomNumber = $("#roomNumber").val();
	var physiciansId = $("#physiciansId").val();
	var additionalPatientId = $("#additionalPatientId").val();
	var tradingPartnerId = $("#tradingPartnerId").val();
	var deliveryLocation = $("#deliveryLocation").val();
	var object = $("#object").val();
	var patientInstance;

	if (object.length === 0){
		patientInstance = patientModel.create({
			"uhsPatientId": uhsPatientId,
			"localUhsPatientId": localUhsPatientId,
			"accountId": accountId,
			"firstName": firstName,
			"middleInitial": middleInitial,
			"lastName": lastName,
			"hospitalPatientId" : hospitalPatientId,
			"roomNumber": roomNumber,
			"physiciansId": physiciansId,
			"additionalPatientId": additionalPatientId,
			"tradingPartnerId": tradingPartnerId,
			"deliveryLocation": deliveryLocation,
			"employeeId": currentEmployeeId
		});

		patientInstance.updateAttributes({
			"localUhsPatientId": patientInstance.get("object")
		});

		var updatedUhsPatientId = patientInstance.get("uhsPatientId");
		var updatedLocalUhsPatientId = patientInstance.get("localUhsPatientId");

		var sqlExpression = [];
		sqlExpression[0] = localTransferNumber;

		var sql = "select accountId, ";
		sql += "comment, ";
		sql += "cstat, ";
		sql += "deliveryDate, ";
		sql += "department, ";
		sql += "localSwapOutNumber, ";
		sql += "localTransferNumber, ";
		sql += "localUhsPatientId, ";
		sql += "orderBy, ";
		sql += "orderDate, ";
		sql += "postedByEmployeeId, ";
		sql += "purchaseOrder, ";
		sql += "status, ";
		sql += "swapOutFlag, ";
		sql += "swapOutNumber, ";
		sql += "telephoneNumber, ";
		sql += "transferDate, ";
		sql += "transferNumber, ";
		sql += "transferType, ";
		sql += "transferredByEmployeeId, ";
		sql += "uhsPatientId, ";
		sql += "object ";
		sql += "from transferHeader ";
		sql += "where localTransferNumber = ?";
		var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

		if (transferHeaderArray.length > 0){
			var transferHeaderInstance = transferHeaderModel.make({
				"accountId": transferHeaderArray[0].accountId,
				"comment": transferHeaderArray[0].comment,
				"cstat": transferHeaderArray[0].cstat,
				"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
				"deliveryDate": transferHeaderArray[0].deliveryDate,
				"department": transferHeaderArray[0].department,
				"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
				"localTransferNumber": transferHeaderArray[0].localTransferNumber,
				"localUhsPatientId": updatedLocalUhsPatientId,
				"orderBy": transferHeaderArray[0].orderBy,
				"orderDate": transferHeaderArray[0].orderDate,
				"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
				"purchaseOrder": transferHeaderArray[0].purchaseOrder,
				"status": transferHeaderArray[0].status,
				"swapOutFlag": transferHeaderArray[0].swapOutFlag,
				"swapOutNumber": transferHeaderArray[0].swapOutNumber,
				"telephoneNumber": transferHeaderArray[0].telephoneNumber,
				"transferDate" : transferHeaderArray[0].transferDate,
				"transferNumber" : transferHeaderArray[0].transferNumber,
				"transferType": transferHeaderArray[0].transferType,
				"transferredByEmployeeId": transferHeaderArray[0].transferredByEmployeeId,
				"uhsPatientId": updatedUhsPatientId,
				"employeeId": currentEmployeeId,
				"object": transferHeaderArray[0].object
			});

			transferHeaderInstance.save();
		}

		sqlExpression = [];
		sqlExpression[0] = localTransferNumber;

		sql = "select cstat, ";
		sql += "department, ";
		sql += "description, ";
		sql += "employeeInitials, ";
		sql += "localTransferDetailId, ";
		sql += "localTransferNumber, ";
		sql += "localUhsPatientId, ";
		sql += "prefix, ";
		sql += "purchaseOrder, ";
		sql += "reasonRefused, ";
		sql += "refusedFlag, ";
		sql += "scanOffDate, ";
		sql += "scanOnDate, ";
		sql += "transferDate, ";
		sql += "transferDetailId, ";
		sql += "transferNumber, ";
		sql += "uhsPatientId, ";
		sql += "unit, ";
		sql += "employeeId, ";
		sql += "object ";
		sql += "from transferDetail ";
		sql += "where localTransferNumber = ? ";
		var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

		var transferDetailInstance;
		for (var i=0; i < transferDetailArray.length; i++){
			transferDetailInstance = transferDetailModel.make({
				"cstat": transferDetailArray[i].cstat,
				"department": transferDetailArray[i].department,
				"description": transferDetailArray[i].description,
				"employeeInitials": transferDetailArray[i].employeeInitials,
				"localTransferDetailId": transferDetailArray[i].localTransferDetailId,
				"localTransferNumber": transferDetailArray[i].localTransferNumber,
				"localUhsPatientId": updatedLocalUhsPatientId,
				"prefix": transferDetailArray[i].prefix,
				"purchaseOrder": transferDetailArray[i].purchaseOrder,
				"reasonRefused": transferDetailArray[i].reasonRefused,
				"refusedFlag": transferDetailArray[i].refusedFlag,
				"scanOffDate": transferDetailArray[i].scanOffDate,
				"scanOnDate": transferDetailArray[i].scanOnDate,
				"transferDate": transferDetailArray[i].transferDate,
				"transferDetailId": transferDetailArray[i].transferDetailId,
				"transferNumber": transferDetailArray[i].transferNumber,
				"uhsPatientId": updatedUhsPatientId,
				"unit": transferDetailArray[i].unit,
				"employeeId": transferDetailArray[i].employeeId,
				"object": transferDetailArray[i].object
			});

			transferDetailInstance.save();
		}
	}
	else {
		patientInstance = patientModel.make({
			"uhsPatientId": uhsPatientId,
			"localUhsPatientId": localUhsPatientId,
			"accountId": accountId,
			"firstName": firstName,
			"middleInitial": middleInitial,
			"lastName": lastName,
			"hospitalPatientId" : hospitalPatientId,
			"roomNumber": roomNumber,
			"physiciansId": physiciansId,
			"additionalPatientId": additionalPatientId,
			"tradingPartnerId": tradingPartnerId,
			"deliveryLocation": deliveryLocation,
			"employeeId": currentEmployeeId,
			"object": object
		});

		patientInstance.save();
	}
	readTask(transferType + "~" + localTransferNumber);
	Rho.Log.info("End: saveTaskPatient", "inMotion");
}

function saveRefusedItems(){
	Rho.Log.info("Start: saveRefusedItems()", "inMotion");

	userDatabase.startTransaction();
	try	{
		var localTripId = $("#tripContainer").attr("data-localTripId");
		var tripId = $("#tripContainer").attr("data-tripId");
		var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
		var transferType = $("#taskHeaderContainer").attr("data-transferType");
		var accountId = $("#taskHeaderContainer").attr("data-accountId");
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
		var currentEmployeeInitials = $("#tripContainer").attr("data-currentEmployeeInitials");
		var currentTimestamp = getCurrentTimestampString();
		var reasonRefused = $("#reasonRefused").val();
		var notes = $("#notes").val();

		//get all selected units
		if ($(".refuseList[src='images/uhs/checkbox-checked.png']").length > 0){
			$(".refuseList[src='images/uhs/checkbox-checked.png']").each(function(){
				var transferCommentInstance;
				var transferDetailInstance;
	    		var transferHeaderInstance = transferHeaderModel.create({
					"accountId": accountId,
					"comment": "",
					"cstat": "",
					"deliveredByEmployeeId": currentEmployeeId,
					"deliveryDate": currentTimestamp,
					"department": "",
					"localSwapOutNumber": 0,
					"localTransferNumber": 0,
					"localUhsPatientId": 0,
					"orderBy": "",
					"orderDate": currentTimestamp,
					"postedByEmployeeId": currentEmployeeId,
					"purchaseOrder": "",
					"status": "C",
					"swapOutFlag": "N",
					"swapOutNumber": 0,
					"telephoneNumber": 0,
					"transferDate" : currentTimestamp,
					"transferNumber" : 0,
					"transferType": "P",
					"transferredByEmployeeId": currentEmployeeId,
					"uhsPatientId": 0,
					"employeeId": currentEmployeeId
				});

				transferHeaderInstance.updateAttributes({
					"localTransferNumber": transferHeaderInstance.get("object")
				});

				var prefix = $(this).attr("data-prefix");
				var unit = $(this).attr("data-unit");

				//create pickup detail record for each item. set refusal fields
				transferDetailInstance = transferDetailModel.create({
					"cstat": "",
					"department": "",
					"description": "",
					"employeeInitials": currentEmployeeInitials,
					"localTransferDetailId": "",
					"localTransferNumber": transferHeaderInstance.get("localTransferNumber"),
					"localUhsPatientId": transferHeaderInstance.get("localUhsPatientId"),
					"prefix": prefix,
					"purchaseOrder": "",
					"reasonRefused": reasonRefused,
					"refusedFlag": "Y",
					"transferDate": currentTimestamp,
					"transferDetailId": "",
					"transferNumber": transferHeaderInstance.get("transferNumber"),
					"uhsPatientId": transferHeaderInstance.get("uhsPatientId"),
					"unit": unit,
					"employeeId": currentEmployeeId,
					"scanOffDate": "0001-01-01 00:00:00.0",
					"scanOnDate": currentTimestamp,
				});

				transferDetailInstance.updateAttributes({
					"localTransferDetailId": transferDetailInstance.get("object")
				});

				//create comment record for each pickup detail if notes exist
				if (notes.length > 0){
					transferCommentInstance = transferCommentModel.create({
						"comment": "REFUSED: " + notes,
						"commentDate": currentTimestamp,
						"localTransferCommentId": "",
						"localTransferNumber": transferHeaderInstance.get("localTransferNumber"),
						"prefix": prefix,
						"transferCommentId": "",
						"transferNumber": transferHeaderInstance.get("transferNumber"),
						"unit": unit,
						"employeeId": currentEmployeeId,
					});

					transferCommentInstance.updateAttributes({
						"localTransferCommentId": transferCommentInstance.get("object")
					});
				}

				//add pickup transfer to trip detail
				var tripDetailInstance = tripDetailModel.create({
					"accountId": accountId,
					"localTaskReferenceId": transferHeaderInstance.get("localTransferNumber"),
					"localTripDetailId": 0,
					"localTripId": localTripId,
					"taskReferenceId": transferHeaderInstance.get("transferNumber"),
					"taskType": transferHeaderInstance.get("transferType"),
					"tripDetailId": 0,
					"tripId": tripId,
					"employeeId": currentEmployeeId,
					"scanLevel": 0
				});

				tripDetailInstance.updateAttributes({
					"localTripDetailId": tripDetailInstance.get("object")
				});
				
				//update deliveryDate on transferHeader if first scan off truck
				var sqlExpression = [];
				sqlExpression[0] = localTransferNumber;

				var sql = "select sum(case when scanOffDate = '0001-01-01 00:00:00.0' then 0 else 1 end) as transferDetailCount ";
				sql += "from transferDetail td ";
				sql += "where td.localTransferNumber = ? ";
				var transferDetailCountArray = userDatabase.executeSql(sql, sqlExpression);

				if (transferDetailCountArray.length > 0){
					if (transferDetailCountArray[0].transferDetailCount == 0){
						//retrieve transferHeader
						sqlExpression = [];
						sqlExpression[0] = localTransferNumber;

						sql = "select accountId, ";
						sql += "comment, ";
						sql += "cstat, ";
						sql += "deliveredByEmployeeId, ";
						sql += "deliveryDate, ";
						sql += "department, ";
						sql += "localSwapOutNumber, ";
						sql += "localTransferNumber, ";
						sql += "localUhsPatientId, ";
						sql += "orderBy, ";
						sql += "orderDate, ";
						sql += "postedByEmployeeId, ";
						sql += "purchaseOrder, ";
						sql += "status, ";
						sql += "swapOutFlag, ";
						sql += "swapOutNumber, ";
						sql += "telephoneNumber, ";
						sql += "transferDate, ";
						sql += "transferNumber, ";
						sql += "transferType, ";
						sql += "transferredByEmployeeId, ";
						sql += "uhsPatientId, ";
						sql += "object ";
						sql += "from transferHeader ";
						sql += "where localTransferNumber = ? ";
						var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

						if (transferHeaderArray.length > 0){
							transferHeaderInstance = transferHeaderModel.make({
								"accountId": transferHeaderArray[0].accountId,
								"comment": transferHeaderArray[0].comment,
								"cstat": transferHeaderArray[0].cstat,
								"deliveredByEmployeeId": currentEmployeeId,
								"deliveryDate": getCurrentTimestampString(),
								"department": transferHeaderArray[0].department,
								"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
								"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
								"orderBy": transferHeaderArray[0].orderBy,
								"orderDate": transferHeaderArray[0].orderDate,
								"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
								"purchaseOrder": transferHeaderArray[0].purchaseOrder,
								"status": transferHeaderArray[0].status,
								"swapOutFlag": transferHeaderArray[0].swapOutFlag,
								"swapOutNumber": transferHeaderArray[0].swapOutNumber,
								"telephoneNumber": transferHeaderArray[0].telephoneNumber,
								"transferDate": transferHeaderArray[0].transferDate,
								"transferNumber": transferHeaderArray[0].transferNumber,
								"transferType": transferHeaderArray[0].transferType,
								"transferredByEmployeeId": transferHeaderArray[0].transferredByEmployeeId,
								"uhsPatientId": transferHeaderArray[0].uhsPatientId,
								"employeeId": currentEmployeeId,
								"object": transferHeaderArray[0].object
							});

							transferHeaderInstance.save();
						}
					}
				}
				
				//lookup existing transferDetail delivery record
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;
				sqlExpression[2] = unit;

				//update transferDetail records
				sql = "select cstat, ";
				sql += "department, ";
				sql += "description, ";
				sql += "employeeInitials, ";
				sql += "localTransferDetailId, ";
				sql += "localTransferNumber, ";
				sql += "localUhsPatientId, ";
				sql += "model, ";
				sql += "prefix, ";
				sql += "purchaseOrder, ";
				sql += "reasonRefused, ";
				sql += "refusedFlag, ";
				sql += "scanOffDate, ";
				sql += "scanOnDate, ";
				sql += "transferDate, ";
				sql += "transferDetailId, ";
				sql += "transferNumber, ";
				sql += "uhsPatientId, ";
				sql += "unit, ";
				sql += "vendor, ";
				sql += "employeeId, ";
				sql += "object ";
				sql += "from transferDetail ";
				sql += "where localTransferNumber = ? ";
				sql += "and prefix = ? ";
				sql += "and unit = ? ";
				var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

				//update existing delivery transfer detail with refusal fields
				transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailArray[0].cstat,
					"department": transferDetailArray[0].department,
					"description": transferDetailArray[0].description,
					"employeeInitials": transferDetailArray[0].employeeInitials,
					"localTransferDetailId": transferDetailArray[0].localTransferDetailId,
					"localTransferNumber": transferDetailArray[0].localTransferNumber,
					"localUhsPatientId": transferDetailArray[0].localUhsPatientId,
					"model": transferDetailArray[0].model,
					"prefix": transferDetailArray[0].prefix,
					"purchaseOrder": transferDetailArray[0].purchaseOrder,
					"reasonRefused": reasonRefused,
					"refusedFlag": "Y",
					"scanOffDate": transferDetailArray[0].scanOffDate,
					"scanOnDate": transferDetailArray[0].scanOnDate,
					"transferDate": transferDetailArray[0].transferDate,
					"transferDetailId": transferDetailArray[0].transferDetailId,
					"transferNumber": transferDetailArray[0].transferNumber,
					"uhsPatientId": transferDetailArray[0].uhsPatientId,
					"unit": transferDetailArray[0].unit,
					"vendor": transferDetailArray[0].vendor,
					"employeeId": transferDetailArray[0].employeeId,
					"object": transferDetailArray[0].object
				});

				transferDetailInstance.save();

				//create comment record for each delivery detail if notes exist
				if (notes.length > 0){
					transferCommentInstance = transferCommentModel.create({
						"comment": "REFUSED: " + notes,
						"commentDate": currentTimestamp,
						"localTransferCommentId": "",
						"localTransferNumber": transferDetailInstance.get("localTransferNumber"),
						"prefix": transferDetailInstance.get("prefix"),
						"transferCommentId": "",
						"transferNumber": transferDetailInstance.get("transferNumber"),
						"unit": transferDetailInstance.get("unit"),
						"employeeId": currentEmployeeId
					});

					transferCommentInstance.updateAttributes({
						"localTransferCommentId": transferCommentInstance.get("object")
					});
				}
				
				
			});
			readTripDetail();
			readTaskDetail(transferType + "~" + localTransferNumber);
		}
		else {
			alert("No items have been selected");
			return false;
		}
		userDatabase.commitTransaction();
	}
	catch(e){
		Rho.Log.info("Error: saveRefusedItems rollback = " + e, "inMotion");
		userDatabase.rollbackTransaction();
	}
	finally {
		Rho.Log.info("End: saveRefusedItems", "inMotion");
	}
}

function saveSearchEquipment(){
	Rho.Log.info("Start: saveSearchEquipment()", "inMotion");
	if ($(".equipmentList[src='images/uhs/radiobutton-checked.png']").length > 0){
		$(".equipmentList[src='images/uhs/radiobutton-checked.png']").each(function(){
			var prefix = $(this).attr("data-prefix");
			var unit = $(this).attr("data-unit");
			var jsonObj = {};

			if (prefix.length == 2){
				prefix = prefix + " ";
			}
			jsonObj.data = prefix + formatNumberLength(unit,4);
			jsonObj.source = "modal";
			scannerCallbackMode1(jsonObj);
		});
		enableScanner();
	}
	else {
		alert("No equipment has been selected");
		return false;
	}
	Rho.Log.info("End: saveSearchEquipment", "inMotion");
}

function saveTask(){
	Rho.Log.info("Start: saveTask()", "inMotion");

	userDatabase.startTransaction();
	try {
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
		var localTripId = $("#tripContainer").attr("data-localTripId");
		var transferNumber = $("#transferNumber").val();
		var localTransferNumber = $("#localTransferNumber").val();
		var transferType = $("#transferType").val();
		var status = $("#status").val();
		var accountId = $("#accountId").val();
		var orderDate = $("#orderDate").val();
		var transferDate = $("#transferDate").val();
		var orderBy = $("#orderBy").val();
		var department = $("#department").val();
		var comment = $("#comment").val();
		var telephoneNumber = $("#telephoneNumber").val();
		var deliveryDate = $("#deliveryDate").val();
		var purchaseOrder = $("#purchaseOrder").val();
		var uhsPatientId = $("#uhsPatientId").val();
		var cstat = $("#cstat").val();
		var deliveredByEmployeeId = $("#deliveredByEmployeeId").val();
		var postedByEmployeeId = $("#postedByEmployeeId").val();
		var swapOutFlag = $("#swapOutFlag").val();
		var swapOutNumber = $("#swapOutNumber").val();
		var localSwapOutNumber = $("#localSwapOutNumber").val();
		var transferredByEmployeeId = $("#transferredByEmployeeId").val();
		var localUhsPatientId = $("#localUhsPatientId").val();
		var object = $("#object").val();
		var transferHeaderInstance;
		var sqlExpression;
		var sql;
		var i;

		if (object.length > 0) {
			transferHeaderInstance = transferHeaderModel.make({
				"transferNumber" : transferNumber,
				"localTransferNumber" : localTransferNumber,
				"transferType" : transferType,
				"status" : status,
				"accountId": accountId,
				"orderDate": orderDate,
				"transferDate": transferDate,
				"orderBy": orderBy,
				"department": department,
				"comment": comment,
				"telephoneNumber": telephoneNumber,
				"deliveryDate": deliveryDate,
				"purchaseOrder": purchaseOrder,
				"uhsPatientId": uhsPatientId,
				"cstat": cstat,
				"deliveredByEmployeeId": deliveredByEmployeeId,
				"postedByEmployeeId": postedByEmployeeId,
				"swapOutFlag": swapOutFlag,
				"swapOutNumber": swapOutNumber,
				"localSwapOutNumber": localSwapOutNumber,
				"transferredByEmployeeId": transferredByEmployeeId,
				"localUhsPatientId": localUhsPatientId,
				"employeeId": currentEmployeeId,
				"object": object
			});

			transferHeaderInstance.save();
		}
		else {
			sqlExpression = [];
			sqlExpression[0] = accountId;

			sql = "select accountId, ";
			sql += "employeeId, ";
			sql += "localTaskReferenceId, ";
			sql += "localTripDetailId, ";
			sql += "localTripId, ";
			sql += "scanLevel, ";
			sql += "taskReferenceId, ";
			sql += "taskType, ";
			sql += "tripDetailId, ";
			sql += "tripId, ";
			sql += "object ";
			sql += "from TripDetailTemporary ";
			sql += "where taskType = 'X' ";
			sql += "and accountId = ?";
			var tripDetailArray = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < tripDetailArray.length; i++){
				var tripDetailTemporaryInstance = tripDetailTemporaryModel.make({
					"accountId": tripDetailArray[i].accountId,
					"employeeId": tripDetailArray[i].employeeId,
					"localTaskReferenceId": tripDetailArray[i].localTaskReferenceId,
					"localTripDetailId": tripDetailArray[i].localTripDetailId,
					"localTripId": tripDetailArray[i].localTripId,
					"scanLevel": tripDetailArray[i].scanLevel,
					"taskReferenceId": tripDetailArray[i].taskReferenceId,
					"taskType": tripDetailArray[i].taskType,
					"tripDetailId": tripDetailArray[i].tripDetailId,
					"tripId": tripDetailArray[i].tripId,
					"object": tripDetailArray[i].object
				});

				tripDetailTemporaryInstance.destroy();
			}

			transferHeaderInstance = transferHeaderModel.create({
				"transferNumber" : transferNumber,
				"localTransferNumber" : localTransferNumber,
				"transferType" : transferType,
				"status" : status,
				"accountId": accountId,
				"orderDate": orderDate,
				"transferDate": transferDate,
				"orderBy": orderBy,
				"department": department,
				"comment": comment,
				"telephoneNumber": telephoneNumber,
				"deliveryDate": deliveryDate,
				"purchaseOrder": purchaseOrder,
				"uhsPatientId": uhsPatientId,
				"cstat": cstat,
				"deliveredByEmployeeId": deliveredByEmployeeId,
				"postedByEmployeeId": postedByEmployeeId,
				"swapOutFlag": swapOutFlag,
				"swapOutNumber": swapOutNumber,
				"localSwapOutNumber": localSwapOutNumber,
				"transferredByEmployeeId": transferredByEmployeeId,
				"localUhsPatientId": localUhsPatientId,
				"employeeId": currentEmployeeId
			});

			transferHeaderInstance.updateAttributes({
				"localTransferNumber": transferHeaderInstance.get("object")
			});

			var tripId = $("#tripContainer").attr("data-tripId");
			var tripDetailInstance = tripDetailModel.create({
				"accountId": transferHeaderInstance.get("accountId"),
				"localTaskReferenceId": transferHeaderInstance.get("localTransferNumber"),
				"localTripDetailId": 0,
				"localTripId": localTripId,
				"taskReferenceId": transferHeaderInstance.get("transferNumber"),
				"taskType": transferHeaderInstance.get("transferType"),
				"tripDetailId": 0,
				"tripId": tripId,
				"employeeId": currentEmployeeId,
				"scanLevel": 0
			});

			tripDetailInstance.updateAttributes({
				"localTripDetailId": tripDetailInstance.get("object")
			});
		}

		localTransferNumber = transferHeaderInstance.get("localTransferNumber");
		var tempTransferType = transferHeaderInstance.get("transferType");
		transferType = "";
		if (tempTransferType == "D"){
			transferType = "Delivery";
		}
		else if (tempTransferType == "P"){
			transferType = "Pickup";
		}
		else if (tempTransferType == "F"){
			transferType = "Find";
		}
		else {

		}

		sqlExpression = [];
		sqlExpression[0] = localTransferNumber;

		//update transferDetail records
		sql = "select cstat, ";
		sql += "department, ";
		sql += "description, ";
		sql += "employeeInitials, ";
		sql += "localTransferDetailId, ";
		sql += "localTransferNumber, ";
		sql += "localUhsPatientId, ";
		sql += "prefix, ";
		sql += "purchaseOrder, ";
		sql += "reasonRefused, ";
		sql += "refusedFlag, ";
		sql += "scanOffDate, ";
		sql += "scanOnDate, ";
		sql += "transferDate, ";
		sql += "transferDetailId, ";
		sql += "transferNumber, ";
		sql += "uhsPatientId, ";
		sql += "unit, ";
		sql += "employeeId, ";
		sql += "object ";
		sql += "from transferDetail ";
		sql += "where localTransferNumber = ? ";
		var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

		var transferDetailInstance;
		for (i = 0; i < transferDetailArray.length; i++){
			transferDetailInstance = transferDetailModel.make({
				"cstat": transferDetailArray[i].cstat,
				"department": department,
				"description": transferDetailArray[i].description,
				"employeeInitials": transferDetailArray[i].employeeInitials,
				"localTransferDetailId": transferDetailArray[i].localTransferDetailId,
				"localTransferNumber": transferDetailArray[i].localTransferNumber,
				"localUhsPatientId": transferDetailArray[i].localUhsPatientId,
				"prefix": transferDetailArray[i].prefix,
				"purchaseOrder": purchaseOrder,
				"reasonRefused": transferDetailArray[i].reasonRefused,
				"refusedFlag": transferDetailArray[i].refusedFlag,
				"scanOffDate": transferDetailArray[i].scanOffDate,
				"scanOnDate": transferDetailArray[i].scanOnDate,
				"transferDate": transferDetailArray[i].transferDate,
				"transferDetailId": transferDetailArray[i].transferDetailId,
				"transferNumber": transferDetailArray[i].transferNumber,
				"uhsPatientId": transferDetailArray[i].uhsPatientId,
				"unit": transferDetailArray[i].unit,
				"employeeId": transferDetailArray[i].employeeId,
				"object": transferDetailArray[i].object
			});

			transferDetailInstance.save();
		}

		userDatabase.commitTransaction();
		readTripDetail();
		readTask(transferType + "~" + localTransferNumber);
	}
	catch(e) {
		Rho.Log.info("Error: saveTask rollback=" + e, "inMotion");
		userDatabase.rollbackTransaction();
		alert("Unable to save task");
		return false;
	}
	finally {
		Rho.Log.info("End: saveTask", "inMotion");
	}
}

function search(equipmentObj){
	Rho.Log.info("Start: search()", "inMotion");

	$.get("/public/templates/searchEquipment.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(equipmentObj);
		equipmentObj = null;

		modal.open({
			content: templateWithData,
			fullScreen: true,
			enableScroll: true
		}, saveSearchEquipment);
		$("#saveSearchEquipmentButton").off("click");
		$("#saveSearchEquipmentButton").on("click", function(){
			saveSearchEquipment();
		});
		$("#searchButton").off("click");
		$("#searchButton").on("click", function(){
			searchEquipment();
		});
		$(".equipmentList").off("click");
		$(".equipmentList").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("equipmentList" + index, "equipmentList");
		});
		$(".equipmentContainerText1").off("click");
		$(".equipmentContainerText1").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("equipmentList" + index, "equipmentList");
		});
		$(".equipmentContainerText2").off("click");
		$(".equipmentContainerText2").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("equipmentList" + index, "equipmentList");
		});
		$(".equipmentContainerText3").off("click");
		$(".equipmentContainerText3").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("equipmentList" + index, "equipmentList");
		});
	});

	Rho.Log.info("End: search", "inMotion");
}

function searchEquipment(){
	Rho.Log.info("Start: searchEquipment()", "inMotion");
	detectUHSRhoServer(loadSearchEquipment);
	Rho.Log.info("End: searchEquipment", "inMotion");
}

function loadSearchEquipment() {
	Rho.Log.info("Start: loadSearchEquipment()", "inMotion");
	$("#searchResult").html("<img src='images/loading.gif' style='display:block; margin: auto;'>");
	var searchInput = $("#searchInput").val();
	setModelsSync("none");
	searchEquipmentModel.setSync_type("incremental");
	searchEquipmentModel.initModel();
	setModelNotifications(searchEquipmentCallback);
	Rho.RhoConnectClient.doSync(false, "serialNumber=" + searchInput, false);
	Rho.Log.info("End: loadSearchEquipment", "inMotion");
}

function searchEquipmentCallback(params){
	Rho.Log.info("Start: searchEquipmentCallback(" + JSON.stringify(params) + ")", "inMotion");
	
	var jsonObj = {};
	if (params.status == "error") {
		searchEquipmentModel.setSync_type("none");
		searchEquipmentModel.initModel();
		setModelsSync();
		setModelNotifications();

		jsonObj = {};
		jsonObj.equipment = [];
		search(jsonObj);
	}
	else if (params.status == "complete") {
		searchEquipmentModel.setSync_type("none");
		searchEquipmentModel.initModel();

		setModelsSync();
		setModelNotifications();
		
		var sql = "SELECT prefix, ";
		sql += "unit, ";
		sql += "description, ";
		sql += "serialNumber ";
		sql += "from SearchEquipment ";
		var searchEquipmentArray = userDatabase.executeSql(sql);

		var equipmentObjList = [];
		var equipmentObj;
		for (var i=0; i < searchEquipmentArray.length; i++){
			equipmentObj = {};
			equipmentObj.prefix = searchEquipmentArray[i].prefix;
			equipmentObj.dspUnit = formatNumberLength(searchEquipmentArray[i].unit, 4);
			equipmentObj.unit = searchEquipmentArray[i].unit;
			equipmentObj.description = searchEquipmentArray[i].description;
			equipmentObj.serialNumber = searchEquipmentArray[i].serialNumber;
			equipmentObjList.push(equipmentObj);
		}

		jsonObj = {};
		jsonObj.equipment = equipmentObjList;
		
		if($("#searchResult").length == 0) {
			search(jsonObj);
		}
		else {
			$.get("/public/templates/searchResult.html", function(data){
				var template = Handlebars.compile(data);
				var templateWithData = template(jsonObj);
				jsonObj = null;
				$("#searchResult").html(templateWithData);
				$(".equipmentList").off("click");
				$(".equipmentList").on("click", function(){
					var index = $(this).attr("data-index");
					toggleRadioButton("equipmentList" + index, "equipmentList");
				});
				$(".equipmentContainerText1").off("click");
				$(".equipmentContainerText1").on("click", function(){
					var index = $(this).attr("data-index");
					toggleRadioButton("equipmentList" + index, "equipmentList");
				});
				$(".equipmentContainerText2").off("click");
				$(".equipmentContainerText2").on("click", function(){
					var index = $(this).attr("data-index");
					toggleRadioButton("equipmentList" + index, "equipmentList");
				});
				$(".equipmentContainerText3").off("click");
				$(".equipmentContainerText3").on("click", function(){
					var index = $(this).attr("data-index");
					toggleRadioButton("equipmentList" + index, "equipmentList");
				});
			});
		}
	}
	Rho.Log.info("End: searchEquipmentCallback", "inMotion");
}

function viewTransferOrder(id){
	Rho.Log.info("Start: viewTransferOrder(" + id + ")", "inMotion");
	//need to have way to edit po and department. provide either a link or button on each row of equipment order to open dialog
	var localTransferId = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var sqlExpression = [];
	sqlExpression[0] = localTransferId;

	var sql = "SELECT th.transferNumber, ";
	sql += "th.localTransferNumber, ";
	sql += "th.status, ";
	sql += "th.orderDate, ";
	sql += "th.orderBy, ";
	sql += "th.department, ";
	sql += "th.purchaseOrder, ";
	sql += "th.comment, ";
	sql += "p.firstName, ";
	sql += "p.lastName, ";
	sql += "p.middleInitial, ";
	sql += "p.uhsPatientId, ";
	sql += "p.localUhsPatientId, ";
	sql += "case when length(p.lastName) > 0 then p.lastName || case when length(p.firstName) > 0 then ', ' || p.firstName || ' ' || p.middleInitial else '' end || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end when length(p.hospitalPatientId) > 0 then p.hospitalPatientId || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end else trim(p.additionalPatientId) || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end end as patientName, ";
	sql += "a.accountId, ";
	sql += "a.accountName, ";
	sql += "eo.prefix, ";
	sql += "eo.quantityOrdered, ";
	sql += "eo.purchaseOrder as orderPurchaseOrder, ";
	sql += "eo.department as orderDepartment ";
	sql += "from TransferHeader th ";
	sql += "left outer join Patient p ";
	sql += "on th.localUhsPatientId = p.localUhsPatientId ";
	sql += "left outer join Account a ";
	sql += "on th.accountId = a.accountId ";
	sql += "left outer join transferEquipmentOrder eo ";
	sql += "on th.localTransferNumber = eo.localTransferNumber ";
	sql += "where th.localTransferNumber = ? ";
	sql += "order by eo.prefix ";
	var equipmentOrderArray = userDatabase.executeSql(sql, sqlExpression);

	var transferOrderObj = {};
	var equipmentOrderObjList = [];
	var equipmentOrderObj;
	for (var i=0; i < equipmentOrderArray.length; i++){
		if (i === 0){
			if (equipmentOrderArray[i].transferNumber != 0){
				transferOrderObj.dspTransferNumber = equipmentOrderArray[i].transferNumber;
			}
			else {
				transferOrderObj.dspTransferNumber = equipmentOrderArray[i].localTransferNumber;
			}
			transferOrderObj.transferNumber = equipmentOrderArray[i].transferNumber;
			transferOrderObj.localTransferNumber = equipmentOrderArray[i].localTransferNumber;
			transferOrderObj.status = equipmentOrderArray[i].status;
			transferOrderObj.orderDate = equipmentOrderArray[i].orderDate;
			transferOrderObj.orderBy = equipmentOrderArray[i].orderBy;
			transferOrderObj.department = equipmentOrderArray[i].department;
			transferOrderObj.purchaseOrder = equipmentOrderArray[i].purchaseOrder;
			transferOrderObj.comment = equipmentOrderArray[i].comment;
			transferOrderObj.accountId = equipmentOrderArray[i].accountId;
			transferOrderObj.accountName = equipmentOrderArray[i].accountName;
			transferOrderObj.patientName = equipmentOrderArray[i].patientName;
		}
		equipmentOrderObj = {};
		equipmentOrderObj.localTransferNumber = equipmentOrderArray[i].localTransferNumber;
		equipmentOrderObj.prefix = equipmentOrderArray[i].prefix;
		equipmentOrderObj.quantityOrdered = equipmentOrderArray[i].quantityOrdered;
		equipmentOrderObj.department = equipmentOrderArray[i].orderDepartment;
		equipmentOrderObj.purchaseOrder = equipmentOrderArray[i].orderPurchaseOrder;
		equipmentOrderObjList.push(equipmentOrderObj);
	}
	transferOrderObj.equipmentOrders = equipmentOrderObjList;

	$.get("/public/templates/viewTransferOrder.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(transferOrderObj);
		transferOrderObj = null;
		
		modal.open({
			content: templateWithData,
			hideSave: true,
			fullScreen: true,
			enableScroll: true
		});
	});
	Rho.Log.info("End: viewTransferOrder", "inMotion");
}