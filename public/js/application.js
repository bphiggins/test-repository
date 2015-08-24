var sortedOn = 0;

function compareDate(a, b){
	var aVal = new Date(a.value.substr(0,4), a.value.substr(5,2) - 1, a.value.substr(8,2), a.value.substr(11,2), a.value.substr(14,2), a.value.substr(17,2), a.value.substr(20,6));
	var bVal = new Date(b.value.substr(0,4), b.value.substr(5,2) - 1, b.value.substr(8,2), b.value.substr(11,2), b.value.substr(14,2), b.value.substr(17,2), b.value.substr(20,6));
	return aVal - bVal;
}

function compareNumber(a, b){
	var aVal = parseFloat(a.value);
	var bVal = parseFloat(b.value);
	return aVal - bVal;
}

function compareString(a, b) {
	var aVal = a.value.toLowerCase();
	var bVal = b.value.toLowerCase();
	if (aVal < bVal) {
		return -1;
	}
	else if (aVal > bVal) {
		return 1;
	}
	else {
		return 0;
	}
}

function getImageDataURL(url, success) {
	Rho.Log.info("Start: getImageDataURL()", "inMotion");
    var data, canvas, ctx;
    var img = new Image();

    img.addEventListener('load', function(){
        // Create the canvas element.
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        // Get '2d' context and draw the image.
        ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        // Get canvas data URL
        try{
            data = canvas.toDataURL("image/jpeg", 1.0);
            success({image:img, data:data});
        }
        catch(e){
            Rho.Log.info("Error 2 capturing picture (" + e.message + ")", "inMotion");
        }
    });
    // Load image URL.
    try{
        img.src = url;
    }
    catch(e){
        Rho.Log.info("Error 1 capturing picture (" + e.message + ")", "inMotion");
    }
	Rho.Log.info("End: getImageDataURL", "inMotion");
}

function enableScanner(){
	Rho.Log.info("Start: enableScanner()", "inMotion");
	var scanner = returnImagerScanner();
	if (scanner !== undefined) {
		scanner.disable();
		var mode = -1;
		if ($("#vehicleId").length) {
			mode = 3;
		}
		else if ($("#saveFindEquipmentButton").length) {
			mode = 4;
		}
		else if ($("#taskHeaderContainer").length) {
			var scanLevel = $("#taskHeaderContainer").attr("data-scanLevel");
			if (scanLevel == 0){
				mode = 1;
			}
			else if (scanLevel == 1){
				mode = 2;
			}
		}
		if (mode > -1) {
			Rho.Log.info("Run: enableScanner(" + mode + ")", "inMotion");
			try {
				scanner.decodeVolume = 2;
				//TODO enable callback based on mode passed in ie: enableScanner(mode)
				//mode = 1: when status is loading vehicle scan will create transfer detail and equipment scan records and readTaskDetail
				//mode = 2: when status is in transit scan will update equipment scan record, and change scan icon to blue
				//mode = 3: when on edit trip model scan will populate vehicle id field
				//mode = 4: when on find equipment scan will create pickup order for the item scanned
				//mode = 5: ?????
				
				if (Rho.System.isMotorolaDevice) {
					if (mode == 1){
						//after waking up this enables the camera instead of the 2d imager on the et1 will need to enumerate the scanners and set to the 2d Imager each time
						scanner.enable({}, scannerCallbackMode1);
					}
					else if (mode == 2){
						scanner.enable({}, scannerCallbackMode2);
					}
					else if (mode == 3){
						scanner.enable({}, scannerCallbackMode3);
					}
					else if (mode == 4){
						scanner.enable({}, scannerCallbackMode4);
					}
				}
				else {
					if (mode == 1){
						//after waking up this enables the camera instead of the 2d imager on the et1 will need to enumerate the scanners and set to the 2d Imager each time
						scanner.take({}, scannerCallbackMode1);
					}
					else if (mode == 2){
						scanner.take({}, scannerCallbackMode2);
					}
					else if (mode == 3){
						scanner.take({}, scannerCallbackMode3);
					}
					else if (mode == 4){
						scanner.take({}, scannerCallbackMode4);
					}
				}
			}
			catch (e) {
				Rho.Log.info("Error: enableScanner(" + e.message + ")", "inMotion");
			}
		}
	}
	else {
		Rho.Log.info("Run: enableScanner(simulator)", "inMotion");
	}
	Rho.Log.info("End: enableScanner", "inMotion");
}

function disableScanner() {
	Rho.Log.info("Start: disableScanner()", "inMotion");
	var scanner = returnImagerScanner();
	if (scanner !== undefined) {
		scanner.disable();
	}
	Rho.Log.info("End: disableScanner", "inMotion");
}

function returnImagerScanner() {
	Rho.Log.info("Start: returnImagerScanner()", "inMotion");
	var scanner;
	var isSet = false;
	if (!Rho.System.isRhoSimulator){
		try {
			var scanners = Rho.Barcode.enumerate();
			for (var i = 0; i < scanners.length; i++){
				if (scanners[i].scannerType == "Imager"){
					scanner = scanners[i];
					isSet = true;
					break;
				}
			}
			if (!isSet) {
				for (var j = 0; j < scanners.length; j++){
					scanner = scanners[j];
					isSet = true;
					break;
				}
				if (!isSet) {
					scanner = Rho.Barcode.getDefault();
				}
			}
		}
		catch(e) {
			//make scanner undefined?
			var x;
			scanner = x;
		}
	}
	Rho.Log.info("End: returnImagerScanner", "inMotion");
	return scanner;
}

function formatNumberLength(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

function getCurrentTimestampString() {
	var d = new Date();
	var utcYear = d.getUTCFullYear();
	var utcMonth = d.getUTCMonth() + 1;
	var utcDay = d.getUTCDate();
	var utcHour = d.getUTCHours();
	var utcMinute = d.getUTCMinutes();
	var utcSecond = d.getUTCSeconds();
	var utcMillisecond = d.getUTCMilliseconds();
	var utcDateStr = utcYear + "-" + formatNumberLength(utcMonth,2) + "-" + formatNumberLength(utcDay,2) + " " + formatNumberLength(utcHour,2) + ":" + formatNumberLength(utcMinute,2) + ":" + formatNumberLength(utcSecond,2) + "." + utcMillisecond;
	return utcDateStr;
}

function parseIsoDatetime(dtstr) {
	var dt = dtstr.split(/[: T-]/).map(parseFloat);
	return new Date(dt[0], dt[1] - 1, dt[2], dt[3] || 0, dt[4] || 0, dt[5] || 0, 0);
}

function getTextValue(el) {
	var i;
	var s;

	s = "";
	for (i = 0; i < el.childNodes.length; i++){
		if (el.childNodes[i].nodeType == 3){
			s += el.childNodes[i].nodeValue;
		}
		else {
			s += getTextValue(el.childNodes[i]);
		}
	}
	return s;
}

function hideMenu(){
	$("#menuViewHeldTransfers").off("click");
	$("#menuViewAllAccounts").off("click");
	$("#menuCheckout").off("click");
	$("#menuCloseTrip").off("click");
	$("#menuEditTrip").off("click");
	$("#menuSynchronizeTrip").off("click");
	$("#menuLogout").off("click");
	$("#menuAddDelivery").off("click");
	$("#menuAddPickup").off("click");
	$("#menuAddFind").off("click");
	$("#menuCaptureSignature").off("click");
	$("#menuFacilityDetail").off("click");
	$("#menuRemoveAccount").off("click");
	$("#menuCollapseTasks").off("click");
	$("#menuExpandTasks").off("click");
	$("#menuCloseLeftContainer").off("click");
	$("#menuViewTransferOrder").off("click");
	$("#menuEditOrderItem").off("click");
	$("#menuEnableScanner").off("click");
	$("#menuAddItemScan").off("click");
	$("#menuSearch").off("click");
	$("#menuEditTask").off("click");
	$("#menuAssignTaskPatient").off("click");
	$("#menuEditTaskPatient").off("click");
	$("#menuRemoveTaskPatient").off("click");
	$("#menuRefuseSelectedItems").off("click");
	$("#menuRemoveTask").off("click");
	$("#menuEditItem").off("click");
	$("#menuAssignItemPatient").off("click");
	$("#menuEditItemPatient").off("click");
	$("#menuRemoveItemPatient").off("click");
	$("#menuEditPreferredAccessory").off("click");
	$("#menuAddScan").off("click");
	$("#menuRemoveScan").off("click");
	$("#menuRefuseItem").off("click");
	$("#menuClearRefusal").off("click");
	$("#menuDamagedItem").off("click");
	$("#menuSwapOut").off("click");
	$("#menuCloseRightContainer").off("click");
	$("#menuValidateTrip").off("click");
	$("#menuRefreshTrip").off("click");
	$("#menuLeft").css("left", "-269px");
	$("#menuRight").css("right", "-269px");
	$("#appOverlay").hide();
	$("#appOverlay").off("click");
}

function redoTableRowShading(tableName){
	var table = document.getElementById(tableName);
	var src = table.getElementsByTagName('tbody')[0];
	for (var i = 0; i < src.rows.length; i++) {
		if((src.rows[i].rowIndex) % 2 === 0) {
			src.rows[i].className='listEvenRow';
		}
		else {
			src.rows[i].className='listOddRow';
		}
	}
}

function refreshFrameListScroll() {
	Rho.Log.info("Start: refreshFrameListScroll()", "inMotion");
	if (frameListScroll !== undefined) {
		
		frameListScroll.updateDimensions();
	}
	else {
		
		var containerElement = document.getElementById('frameListWrapper');
		frameListScroll = new FTScroller(containerElement, {
		    scrollbars: true,
		    scrollingX: false
		});
	}
	Rho.Log.info("End: refreshFrameListScroll", "inMotion");
}

function refreshFrameSideScroll() {
	Rho.Log.info("Start: refreshFrameSideScroll()", "inMotion");
	if (frameSideScroll !== undefined) {
		
		frameSideScroll.updateDimensions();
	}
	else {
		
		var containerElement = document.getElementById('frameSideWrapper');
		frameSideScroll = new FTScroller(containerElement, {
		    scrollbars: true,
		    scrollingX: false,
		    updateOnWindowResize: true
		});
	}
	Rho.Log.info("End: refreshFrameSideScroll", "inMotion");
}

function replaceMaxLength(){
	var idMaxLengthMap = {};

    //loop through all input-text and textarea element
    $.each($(':text, textarea, :password'), function () {
        var id = $(this).attr('id'),
            maxlength = $(this).attr('maxlength');

        //element should have id and maxlength attribute
        if ((typeof id !== undefined) && (typeof maxlength !== undefined)) {
            idMaxLengthMap[id] = maxlength;

            //remove maxlength attribute from element
            $(this).removeAttr('maxlength');

            //replace maxlength attribute with onkeypress event
            $(this).on("onkeypress", function(){
            	if(this.value.length >= maxlength ){
            		return false;
            	}
            });
        }
    });

    //bind onchange & onkeyup events
    //This events prevents user from pasting text with length more then maxlength
    $(':text, textarea, :password').on('change keyup', function () {
        var id = $(this).attr('id'),
            maxlength = '';
        if (typeof id !== undefined && idMaxLengthMap.hasOwnProperty(id)) {
            maxlength = idMaxLengthMap[id];
            if ($(this).val().length > maxlength) {

                //remove extra text which is more then maxlength
                $(this).val($(this).val().slice(0, maxlength));
            }
        }
    });
}

function returnScannerData(e) {
	Rho.Log.info("Start: returnScannerData(" + JSON.stringify(e) + ")", "inMotion");
	if (e) {
		if (e.barcode) {
			Rho.Log.info("Running: returnScannerData(barcode)", "inMotion");
			return e.barcode;	
		}
		else if (e.data) {
			Rho.Log.info("Running: returnScannerData(data)", "inMotion");
			return e.data;
		}
		else {
			Rho.Notification.beep({
				"frequency":1000,
				"volume" : 2,
				"duration" : 400
			});
			var data;
			Rho.Log.info("Running: returnScannerData(e.else)", "inMotion");
			return data;
		}
	}
	else {
		Rho.Notification.beep({
			"frequency":1000,
			"volume" : 2,
			"duration" : 400
		});
		var data;
		Rho.Log.info("Running: returnScannerData(else)", "inMotion");
		return data;
	}
}

function scannerCallbackMode1(e){
	Rho.Log.info("Start: scannerCallbackMode1()", "inMotion");
	//mode = 1: when status is loading vehicle scan will create transfer detail and equipment scan records and readTaskDetail
	//check to see if this prefix unit has been scanned on this trip (anywhere)
	var data = returnScannerData(e);
	if (data) {
		var prefix = data.substr(0,3);
		var unit = data.substr(3,4);
		var sqlExpression = [];
		sqlExpression[0] = prefix;
		sqlExpression[1] = unit;

		var sql = "select cstat, ";
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
		sql += "where prefix = ? ";
		sql += "and unit = ? ";
		var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

		if (transferDetailArray.length > 0){
			if (e.source == "modal"){
				modal.close();
			}
			else {
				Rho.Notification.beep({"frequency":1000, "volume" : 2, "duration" : 400});
			}
		}
		else {
			userDatabase.startTransaction();
			try {
				var transferNumber = $("#taskHeaderContainer").attr("data-transferNumber");
				var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
				var transferType = $("#taskHeaderContainer").attr("data-transferType");
				var transferDate = getCurrentTimestampString();
				var currentTimestamp = transferDate;
				var currentEmployeeInitials = $("#tripContainer").attr("data-currentEmployeeInitials");
				var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");

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

				//retrieve transferEquipmentOrder
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;

				sql = "select department, ";
				sql += "description, ";
				sql += "employeeId, ";
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
				var transferEquipmentOrderArray = userDatabase.executeSql(sql, sqlExpression);

				//Check to see if first scan of transfer, if it is change status of transfer header to T
				//if this starts to take to long can possibly combine with query below that looks to see if it has already been scanned
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;

				sql = "select count(*) as transferDetailCount ";
				sql += "from transferDetail ";
				sql += "where localTransferNumber = ? ";
				var transferDetailCountArray = userDatabase.executeSql(sql, sqlExpression);
				var transferHeaderInstance;

				if (transferDetailCountArray.length > 0) {
					if (transferDetailCountArray[0].transferDetailCount == 0) {
						if (transferHeaderArray.length > 0) {
							if (transferHeaderArray[0].transferType == "P" && transferHeaderArray[0].swapOutNumber > 0 ){
								//don't update the transferdate
								transferHeaderInstance = transferHeaderModel.make({
									"accountId": transferHeaderArray[0].accountId,
									"comment": transferHeaderArray[0].comment,
									"cstat": transferHeaderArray[0].cstat,
									"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
									"deliveryDate": transferHeaderArray[0].deliveryDate,
									"department": transferHeaderArray[0].department,
									"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
									"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
									"orderBy": transferHeaderArray[0].orderBy,
									"orderDate": transferHeaderArray[0].orderDate,
									"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
									"purchaseOrder": transferHeaderArray[0].purchaseOrder,
									"status": "T",
									"swapOutFlag": transferHeaderArray[0].swapOutFlag,
									"swapOutNumber": transferHeaderArray[0].swapOutNumber,
									"telephoneNumber": transferHeaderArray[0].telephoneNumber,
									"transferDate": transferHeaderArray[0].transferDate,
									"transferNumber": transferHeaderArray[0].transferNumber,
									"transferType": transferHeaderArray[0].transferType,
									"transferredByEmployeeId": currentEmployeeId,
									"uhsPatientId": transferHeaderArray[0].uhsPatientId,
									"employeeId": currentEmployeeId,
									"object": transferHeaderArray[0].object
								});
							}
							else {
								transferHeaderInstance = transferHeaderModel.make({
									"accountId": transferHeaderArray[0].accountId,
									"comment": transferHeaderArray[0].comment,
									"cstat": transferHeaderArray[0].cstat,
									"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
									"deliveryDate": transferHeaderArray[0].deliveryDate,
									"department": transferHeaderArray[0].department,
									"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
									"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
									"orderBy": transferHeaderArray[0].orderBy,
									"orderDate": transferHeaderArray[0].orderDate,
									"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
									"purchaseOrder": transferHeaderArray[0].purchaseOrder,
									"status": "T",
									"swapOutFlag": transferHeaderArray[0].swapOutFlag,
									"swapOutNumber": transferHeaderArray[0].swapOutNumber,
									"telephoneNumber": transferHeaderArray[0].telephoneNumber,
									"transferDate": transferDate,
									"transferNumber": transferHeaderArray[0].transferNumber,
									"transferType": transferHeaderArray[0].transferType,
									"transferredByEmployeeId": currentEmployeeId,
									"uhsPatientId": transferHeaderArray[0].uhsPatientId,
									"employeeId": currentEmployeeId,
									"object": transferHeaderArray[0].object
								});
							}
							transferHeaderInstance.save();
						}
					}
				}

				//determine what cstat, department, purchaseOrder, uhsPatientId, localUhsPatientId should be applied to the transferDetail record
				var cstat = "";
				var department = "";
				var purchaseOrder = "";
				var uhsPatientId = 0;
				var localUhsPatientId = 0;
				var i;

				if (transferHeaderArray.length > 0){
					cstat = transferHeaderArray[0].cstat;
					department = transferHeaderArray[0].department;
					purchaseOrder = transferHeaderArray[0].purchaseOrder;
					uhsPatientId = transferHeaderArray[0].uhsPatientId;
					localUhsPatientId = transferHeaderArray[0].localUhsPatientId;
					if (transferHeaderArray[0].transferDate != "0001-01-01 00:00:00.0"){
						transferDate = transferHeaderArray[0].transferDate;
					}
				}

				for (i = 0; i < transferEquipmentOrderArray.length; i++){
					if (transferEquipmentOrderArray[i].department.length > 0 || transferEquipmentOrderArray[i].purchaseOrder.length > 0){
						sqlExpression = [];
						sqlExpression[0] = localTransferNumber;
						sqlExpression[1] = prefix;
						if (transferEquipmentOrderArray[i].department.length > 0){
							sqlExpression[2] = transferEquipmentOrderArray[i].department;
						}
						else {
							sqlExpression[2] = department;
						}
						if (transferEquipmentOrderArray[i].purchaseOrder.length > 0){
							sqlExpression[3] = transferEquipmentOrderArray[i].purchaseOrder;
						}
						else {
							sqlExpression[3] = purchaseOrder;
						}

						sql = "select count(*) as transferDetailCount ";
						sql += "from transferDetail ";
						sql += "where localTransferNumber = ? ";
						sql += "and prefix = ? ";
						sql += "and department = ? ";
						sql += "and purchaseOrder = ? ";
						transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

						if (transferDetailArray.length > 0){
							var transferDetailCount = transferDetailArray[0].transferDetailCount;

							if (transferDetailCount < transferEquipmentOrderArray[i].quantityOrdered){
								if (transferEquipmentOrderArray[i].department.length > 0){
									department = transferEquipmentOrderArray[i].department;
								}
								if (transferEquipmentOrderArray[i].purchaseOrder.length > 0){
									purchaseOrder = transferEquipmentOrderArray[i].purchaseOrder;
								}
								break;
							}
						}
					}
				}

				//add record to transfer detail table
				var transferDetailInstance = transferDetailModel.create({
					"cstat": cstat,
					"department": department,
					"description": "",
					"employeeInitials": currentEmployeeInitials,
					"localTransferDetailId": 0,
					"localTransferNumber": localTransferNumber,
					"localUhsPatientId": localUhsPatientId,
					"model" : "",
					"prefix": prefix.toUpperCase(),
					"purchaseOrder": purchaseOrder,
					"reasonRefused": "",
					"refusedFlag": "",
					"transferDate": transferDate,
					"transferNumber": transferNumber,
					"uhsPatientId": uhsPatientId,
					"unit": unit,
					"vendor": "",
					"employeeId": currentEmployeeId,
					"scanOnDate": currentTimestamp,
					"scanOffDate": "0001-01-01 00:00:00.0"
				});

				transferDetailInstance.updateAttributes({
					"localTransferDetailId": transferDetailInstance.get("object")
				});

				//TODO if account does not have unitAccessoryTracking
				var hasUnitAccessoryTracking = $("#taskHeaderContainer").attr("data-hasUnitAccessoryTracking");
				if (hasUnitAccessoryTracking == 0){
					//TODO if accessories have been written for this prefix
					sqlExpression = [];
					sqlExpression[0] = localTransferNumber;
					sqlExpression[1] = prefix;
					sqlExpression[2] = localTransferNumber;
					sqlExpression[3] = prefix;

					sql = "select accessory, ";
					sql += "employeeId, ";
					sql += "ta.localTransferNumber, ";
					sql += "localTransferPrefixId, ";
					sql += "ta.prefix, ";
					sql += "quantity, ";
					sql += "unitCount, ";
					sql += "case when unitCount = 0 then 0 else quantity / (unitCount - 1) end as unitQuantity, ";
					sql += "transferNumber, ";
					sql += "localTransferPrefixId, ";
					sql += "object ";
					sql += "from transferredPrefixAccessories ta ";
					sql += "left outer join ( ";
					sql += "select localTransferNumber, prefix, count(*) as unitCount ";
					sql += "from transferDetail ";
					sql += "where localTransferNumber = ? ";
					sql += "and prefix = ? ";
					sql += "group by localTransferNumber, prefix ) td ";
					sql += "on ta.localTransferNumber = td.localTransferNumber ";
					sql += "and ta.prefix = td.prefix ";
					sql += "where ta.localTransferNumber = ? ";
					sql += "and ta.prefix = ? ";
					var transferredPrefixAccessoriesArray = userDatabase.executeSql(sql, sqlExpression);

					for (i = 0; i < transferredPrefixAccessoriesArray.length; i++){
						//TODO update accessory quantity
						var transferredPrefixAccessoriesInstance = transferredPrefixAccessoriesModel.make({
							"accessory": transferredPrefixAccessoriesArray[i].accessory,
							"employeeId": transferredPrefixAccessoriesArray[i].employeeId,
							"localTransferNumber": transferredPrefixAccessoriesArray[i].localTransferNumber,
							"localTransferPrefixId": transferredPrefixAccessoriesArray[i].localTransferPrefixId,
							"prefix": transferredPrefixAccessoriesArray[i].prefix,
							"quantity": transferredPrefixAccessoriesArray[i].unitQuantity * transferredPrefixAccessoriesArray[i].unitCount,
							"transferNumber": transferredPrefixAccessoriesArray[i].transferNumber,
							"object": transferredPrefixAccessoriesArray[i].object
						});
						transferredPrefixAccessoriesInstance.save();
					}
				}

				readTaskDetail(transferType + "~" + localTransferNumber);
				if (e.source == "modal"){
					modal.close();
				}
				userDatabase.commitTransaction();
			}
			catch(e){
				Rho.Log.info("Error: scannerCallbackMode1 rollback = " + e, "inMotion");
				userDatabase.rollbackTransaction();
				alert ("Unable to process scan (Mode1)");
			}
		}
	}
	else {
		Rho.Log.info("Running: scannerCallbackMode1(no data)", "inMotion");
	}
	Rho.Log.info("End: scannerCallbackMode1", "inMotion");
}

function scannerCallbackMode2(e){
	Rho.Log.info("Start: scannerCallbackMode2(" + JSON.stringify(e) + ")", "inMotion");
	//mode = 2: when status is in transit scan will update equipment scan record, and change scan icon to blue
	var data = returnScannerData(e);
	if (data) {
		var prefix = data.substr(0,3);
		var unit = data.substr(3,4);

		addScan(prefix + "~" + unit);
		if (e.source == "modal"){
			modal.close();
		}
	}
	else {
		Rho.Log.info("Running: scannerCallbackMode2(no data)", "inMotion");
	}
	Rho.Log.info("End: scannerCallbackMode2", "inMotion");
}

function scannerCallbackMode3(e){
	Rho.Log.info("Start: scannerCallbackMode3(" + JSON.stringify(e) + ")", "inMotion");
	//mode = 3: when on edit trip model scan will populate vehicle id field
	var data = returnScannerData(e);
	if (data) {
		var vin = data.substr(0,17);
		$("#vehicleId").val(vin);
	}
	else {
		Rho.Log.info("Running: scannerCallbackMode3(no data)", "inMotion");
	}
	Rho.Log.info("End: scannerCallbackMode3", "inMotion");
}

function scannerCallbackMode4(e){
	Rho.Log.info("Start: scannerCallbackMode4(" + JSON.stringify(e) + ")", "inMotion");
	//mode = 4: when on find equipment scan will create pickup order for the item scanned
	var data = returnScannerData(e);
	if (data) {
		var prefix = data.substr(0,3);
		var unit = parseInt(data.substr(3,4),10);

		$("img[data-itemId='" + prefix + "~" + unit + "']").attr("src", "images/uhs/scanOnVehicle.png");
	}
	else {
		Rho.Log.info("Running: scannerCallbackMode4(no data)", "inMotion");
	}
	Rho.Log.info("End: scannerCallbackMode4", "inMotion");
}

function applicationSendLog(callBack) {
	Rho.Log.info("Start: applicationSendLog()", "inMotion");
	if (!Rho.System.isRhoSimulator){
		var host = Rho.RhoConnectClient.syncServer.split("//")[1].split(".")[0].toLowerCase();
		var shortHost = host.substring(0, 7);
		if (host == "rho4prod" || shortHost == "rho4prod") {
			Rho.Log.destinationURI = "http://www.uhs.com:17000/InMotionLogRestApi/jaxrs/log";
		}
		else {
			Rho.Log.destinationURI = "http://natasha.int.uhs.com:17001/InMotionLogRestApi/jaxrs/log";
		}
		if (callBack) {
			Rho.Log.sendLogFile(callBack);	
		}
		else {
			Rho.Log.sendLogFile();	
		}
	}
	else {
		if (callBack) {
			callBack({"status":"ok"});
		}
		Rho.Log.info("Running: applicationSendLog from Simulator", "inMotion");
	}
	Rho.Log.info("End: applicationSendLog", "inMotion");
}

function sendLogCallback(params) {
	Rho.Log.info("Start: sendLogCallback(" + JSON.stringify(params) + ")", "inMotion");
	var status = params.status;
	if (status == "ok"){
		Rho.Log.cleanLogFile();
		alert("log sent successfully");
	}
	else {
		alert("An error occurred and the log was not sent");
	}
	Rho.Log.info("End: sendLogCallback", "inMotion");
}

function sendRefreshCommand() {
	Rho.Log.info("Start: sendRefreshCommand()", "inMotion");
	detectUHSRhoServer(sendRefreshCommandConnected);
	Rho.Log.info("End: sendRefreshCommand", "inMotion");
}

function sendRefreshCommandConnected() {
	Rho.Log.info("Start: sendRefreshCommandConnected()", "inMotion");
	var msg = "You are about to refresh your trip from inCommand, you will lose any unsync-ed data.  ";
	msg += "You may be required to log back into inMotion.\n\nContinue?";
	var response = confirm(msg);
	if (response === true){
		msg = "You should have been instructed to do this by inMotion Support only.\n\n";
		msg += "You will lose any data on the device that is not in inCommand, including photos and signatures.\n\nContinue?";
		response = confirm(msg);
		if (response === true){
		 	$.get("/public/templates/loading.html", function(loadingData){
				modal.open({
					content: loadingData,
					hideSave: true,
					hideClose: true
				});
		 	});
		 	applicationResetScript();
		}
	}
	Rho.Log.info("End: sendRefreshCommandConnected", "inMotion");
}

function showMenu(side, menu, id){
	var applicationMode = $("#tripContainer").attr("data-applicationMode");
	$("#appOverlay").show();
	$("#appOverlay").off("click");
	$("#appOverlay").on("click", function(){
		enableScanner();
		hideMenu();
	});

	disableScanner();
	if (side=="left"){
		if (menu == "trip") {
			$.get("/public/templates/tripMenu.html", function(data){
				$("#menuLeftContent").replaceWith(data);
				if (applicationMode == "capture signature"){
					$("#menuViewHeldTransfers").css({"color": "#557B9F"});
					$("#menuViewAllAccounts").css({"color": "#557B9F"});
					$("#menuCheckout").css({"color": "#557B9F"});
					$("#menuCloseTrip").css({"color": "#557B9F"});
					$("#menuEditTrip").css({"color": "#557B9F"});
					$("#menuValidateTrip").css({"color": "#557B9F"});
					$("#menuSynchronizeTrip").css({"color": "#557B9F"});
					$("#menuRefreshTrip").css({"color": "#557B9F"});
					$("#menuLogout").css({"color": "#557B9F"});
				}
				else {
					$("#menuViewHeldTransfers").on("click", function(){
						readHeldTransfers("name");
					});
					$("#menuViewAllAccounts").on("click", function(){
						readAllAccounts("name");
					});
					$("#menuCheckout").on("click", function(){
						preCheckout();
					});
					$("#menuCloseTrip").on("click", function(){
						closeTrip();
					});
					$("#menuEditTrip").on("click", function(){
						displayUpdateTrip();
					});
					$("#menuValidateTrip").on("click", function(){
						validateTrip();
					});
					$("#menuSynchronizeTrip").on("click", function(){
						hideMenu();
						syncModelDataManual();
					});
					$("#menuRefreshTrip").on("click", function(){
						readTrip();
						hideMenu();
					});
					$("#menuLogout").on("click", function(){
						logout();
					});
				}
				$("#menuCloseLeftContainer").on("click", function() {
					enableScanner();
					hideMenu();
				});
				setTimeout(function() {
					menuLeftScroll.updateDimensions();
					//menuLeftScroll.refresh();
				}, 0);
			});
		}
		else {
			$.get("/public/templates/accountMenu.html", function(data){
				$("#menuLeftContent").replaceWith(data);
				if (applicationMode == "capture signature"){
					$("#menuAddDelivery").css({"color": "#557B9F"});
					$("#menuAddPickup").css({"color": "#557B9F"});
					$("#menuAddFind").css({"color": "#557B9F"});
					$("#menuCaptureSignature").css({"color": "#557B9F"});
					$("#menuRemoveAccount").css({"color": "#557B9F"});
				}
				else {
					$("#menuAddDelivery").on("click", function(){
						addDelivery(id);
					});
					$("#menuAddPickup").on("click", function(){
						addPickup(id);
					});
					$("#menuAddFind").on("click", function(){
						addFind(id);
					});
					$("#menuCaptureSignature").on("click", function(){
						signatureCheck(id);
					});
					$("#menuRemoveAccount").on("click", function(){
						removeAccount(id);
					});
				}

				$("#menuFacilityDetail").on("click", function(){
					readFacilityDetail(id);
				});
				$("#menuCollapseTasks").on("click", function(){
					toggleTasks(id);
				});
				$("#menuExpandTasks").on("click", function(){
					toggleTasks(id);
				});
				$("#menuCloseLeftContainer").on("click", function() {
					enableScanner();
					hideMenu();
				});
				setTimeout(function() {
					menuLeftScroll.updateDimensions();
					//menuLeftScroll.refresh();
				}, 0);
			});
		}
		$("#menuLeft").css("left", "0");
	}
	else {
		if (menu == "task"){
			$.get("/public/templates/taskMenu.html", function(data){
				$("#menuRightContent").replaceWith(data);
				var scanLevel = $("#taskHeaderContainer").attr("data-scanLevel");
				if (scanLevel == "1"){
					$("#menuEditOrderItem").css({"color": "#557B9F"});
					$("#menuSearch").css({"color": "#557B9F"});
					$("#menuAddItemScan").css({"color": "#557B9F"});
				}
				else {
					$("#menuEditOrderItem").on("click", function() {
						editOrderItem();
					});
					$("#menuSearch").on("click", function() {
						search();
					});
					$("#menuAddItemScan").on("click", function() {
						addItemScan();
					});
				}
				$("#menuViewTransferOrder").on("click", function() {
					var id = $("#transferNumber").val();
					viewTransferOrder(id);
				});
				$("#menuEnableScanner").on("click", function() {
					enableScanner();
					hideMenu();
				});
				$("#menuEditTask").on("click", function() {
					editTask();
				});
				$("#menuEditTaskPatient").on("click", function() {
					editTaskPatient();
				});
				$("#menuAssignTaskPatient").on("click", function() {
					assignTaskPatient();
				});
				$("#menuRemoveTaskPatient").on("click", function() {
					removeTaskPatient();
				});
				$("#menuRefuseSelectedItems").on("click", function() {
					refuseSelectedItems();
				});
				$("#menuRemoveTask").on("click", function() {
					removeTask();
				});
				$("#menuCloseRightContainer").on("click", function() {
					enableScanner();
					hideMenu();
				});
				setTimeout(function() {
					menuRightScroll.updateDimensions();
					//menuRightScroll.refresh();
				}, 0);
			});
		}
		else {
			$.get("/public/templates/itemMenu.html", function(data){
				$("#menuRightContent").replaceWith(data);
				$("#menuEditItem").on("click", function() {
					editItem(id);
				});
				$("#menuAssignItemPatient").on("click", function() {
					assignTaskPatient(id);
				});
				$("#menuEditItemPatient").on("click", function() {
					editItemPatient(id);
				});
				$("#menuRemoveItemPatient").on("click", function() {
					removeItemPatient(id);
				});
				$("#menuEditPreferredAccessory").on("click", function() {
					editPreferredAccessory(id);
				});
				//TODO hide element if scanLevel  = 0
				var scanLevel = $("#taskHeaderContainer").attr("data-scanLevel");
				if (scanLevel == "0"){
					$("#menuAddScan").css({"color": "#557B9F"});
				}
				else if (scanLevel == "1"){
					$("#menuAddScan").on("click", function() {
						addScan(id);
					});
				}
				$("#menuRemoveScan").on("click", function() {
					removeScan(id);
				});

				var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
				var prefix = id.split("~")[0];
				var unit = id.split("~")[1];

				var sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;
				sqlExpression[2] = unit;

				var sql = "select refusedFlag ";
				sql += "from TransferDetail ";
				sql += "where localTransferNumber = ? ";
				sql += "and prefix = ? ";
				sql += "and unit = ? ";
				var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

				if (transferDetailArray.length > 0){
					if (transferDetailArray[0].refusedFlag == "Y"){
						$("#menuRefuseItem").css({"color": "#557B9F"});
						$("#menuClearRefusal").on("click", function() {
							clearRefusal(id);
						});
					}
					else {
						$("#menuClearRefusal").css({"color": "#557B9F"});
						$("#menuRefuseItem").on("click", function() {
							refuseItem(id);
						});
					}
				}

				$("#menuDamagedItem").on("click", function() {
					damagedItem(id);
				});
				$("#menuSwapOut").on("click", function() {
					swapout(id);
				});
				$("#menuCloseRightContainer").on("click", function() {
					enableScanner();
					hideMenu();
				});
				setTimeout(function() {
					menuRightScroll.updateDimensions();
					//menuRightScroll.refresh();
				}, 0);
			});
		}
		$("#menuRight").css("right", "0");
	}
}

function sortTable(tableName, columnIndex, dataType){
	var table = document.getElementById(tableName);
	var tbody = table.getElementsByTagName('tbody')[0];
	var rows = tbody.getElementsByTagName('tr');
	var i;

	var rowArray = [];
	for (i = 0; i < rows.length; i++) {
		rowArray[i] = {};
		rowArray[i].oldIndex = i;
		rowArray[i].value = getTextValue(rows[i].cells[columnIndex]);
	}

	if (columnIndex == sortedOn) {
		rowArray.reverse();
	}
	else {
		sortedOn = columnIndex;

		if (dataType == "date"){
			rowArray.sort(compareDate);
		}
		else if (dataType == "number"){
			rowArray.sort(compareNumber);
		}
		else {
			rowArray.sort(compareString);
		}
	}

	var newTbody = document.createElement('tbody');
	for (i = 0; i < rows.length; i++) {
		newTbody.appendChild(rows[rowArray[i].oldIndex].cloneNode(true));
	}

	table.replaceChild(newTbody, tbody);
	redoTableRowShading(tableName);
}

function toggleCheckbox(element){
	if($("#" + element).attr("src") == "images/uhs/checkbox-unchecked.png"){
		$("#" + element).attr("src", "images/uhs/checkbox-checked.png");
	}
	else{
		$("#" + element).attr("src", "images/uhs/checkbox-unchecked.png");
	}
}

function toggleRadioButton(element, classObj){
	if($("#" + element).attr("src") == "images/uhs/radiobutton-unchecked.png"){
		$("." + classObj).attr("src", "images/uhs/radiobutton-unchecked.png");
		$("#" + element).attr("src", "images/uhs/radiobutton-checked.png");
	}
	else{
		$("#" + element).attr("src", "images/uhs/radiobutton-unchecked.png");
	}
}

function detectUHSRhoServer(successFunction, failureFunction) {
	Rho.Log.info("Start: detectUHSRhoServer()", "inMotion");
	failureFunction = failureFunction ? failureFunction : function() {
		if (Rho.Network.hasWifiNetwork()) {
			alert("Unable to connect to UHS, please:\n1. Connect to the UHS or UHS_Guest wireless network\n2. Turn off Wi-Fi\n OR\n3. Accept the Terms & Conditions of the current wireless network.");
		}
		else {
			alert("Unable to connect to UHS, please find a wireless connection or 3G coverage to continue.");
		}
		enableScanner();
	};
	var port = Rho.RhoConnectClient.syncServer.split("://")[0].split(".")[0].toLowerCase() == "https" ? 443 : 80;
	Rho.Network.detectConnection(
		{
			"host": Rho.RhoConnectClient.syncServer,
			"port" : port,
			"pollInterval" : 5000
		}, function(params){
			Rho.Log.info("Start: detectUHSRhoServerCallback(" + JSON.stringify(params) + ")", "inMotion");
			Rho.Network.stopDetectingConnection(function () {});
			if (params.connectionInformation == "Connected") {
				Rho.Log.info("End: detectUHSRhoServerCallback(connected)", "inMotion");
				successFunction();
			}
			else {
				Rho.Log.info("End: detectUHSRhoServerCallback(disconnected)", "inMotion");
				failureFunction();
			}
	});
	Rho.Log.info("End: detectUHSRhoServer", "inMotion");
}

function reloadApplicationNoConnection() {
	Rho.Log.info("Start: reloadApplicationNoConnection()", "inMotion");
	if (Rho.Network.hasWifiNetwork()) {
		alert("Unable to connect to UHS, please:\n1. Connect to the UHS or UHS_Guest wireless network\n2. Turn off Wi-Fi\n OR\n3. Accept the Terms & Conditions of the current wireless network.");
	}
	else {
		alert("Unable to connect to UHS, please find a wireless connection or 3G coverage to continue.");
	}
	stopRhoSync();
	$.get("/public/templates/login.html", function(data){
		$("#content").replaceWith(data);
		$("#loginError").html("Unable to connect to UHS");
		$("#loginButtonConnect").removeAttr('disabled');
		modal.close(false);
		deleteLogin();
		loadLogin();
	});
	Rho.Log.info("End: reloadApplicationNoConnection()", "inMotion");
}

function getEmployeeId() {
	Rho.Log.info("Start: getEmployeeId()", "inMotion");
	var unDef;
	var eeId = Rho.RhoConnectClient.userName;
	
	if (isNaN(parseInt(eeId))) {
		var sql = "select employeeId from Employee";
		try {
			var employee = userDatabase.executeSql(sql);
			if (employee.length > 0) {
				eeId = employee[0].employeeId;
			}
			else {
				eeId = unDef;
			}
		}
		catch(e) {
			eeId = unDef;
		}
	}
	Rho.Log.info("End: getEmployeeId(" + eeId + ")", "inMotion");
	return eeId;
}

function getRhoSession() {
	Rho.Log.info("Start: getRhoSession()", "inMotion");

	var sql = "select session from client_info";
	try {
		var sessionCookie = userDatabase.executeSql(sql);
		if (sessionCookie.length > 0) {
			return sessionCookie[0].session;
		}
		else {
			return "";
		}
	}
	catch(e) {
		Rho.Log.info("Error: getRhoSession (" + e.message + ")", "inMotion");
		return "";
	}
	Rho.Log.info("End: getRhoSession", "inMotion");
}