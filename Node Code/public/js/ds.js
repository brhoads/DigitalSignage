function showErrorModal(){
	$('#statusModalTitle').html('Error Sending Overrides');
	$('#statusModalContent').html('Please contact DD2 for help');
	$('#statusModal').foundation('reveal', 'open');
};

$('#piSwitchOn,#piSwitchOff').change(function(e){
	if($('#piSwitchOn').prop('checked')){
		//All the Pis need selected
		$('.picheck').each(function(index){
			//$(this).prop('checked',true);
			$(this).next().addClass('checked');
			//$('span.custom.checkbox').toggleClass('checked');
		});
	} else {
		//All the Pis need unselected
		$('.picheck').each(function(index){
			$(this).next().removeClass('checked');
		});
	}
});
$(".custom input[type='checkbox']").parent().click(function() {
	if($(this).children("input").is(":checked") !== $(this).children("span").is(".checked")) {
		if($(this).children("input").is(":checked")) {
			$(this).children("span").addClass("checked");
		} else {
			$(this).children("span").removeClass("checked");
		}
	}
});
$('#overrideTypeDropdown').change(function(e){
	if($(this).val() === 'Play IPTV'){
		$('#iptvDiv').removeClass('hidden');
	} else {
		$('#iptvDiv').addClass('hidden');
	}
});

$('#submitButton').click(function(e){
	//Scrape all the checkboxes and get the piDees from them
	//	this will then be POSTed to the server which will then
	//	tell the Pis to handle the override
	var piDees = new Array();
	var location;
	var channel;
	
	$('.custom.checkbox.checked').each(function(index){
		piDees.push($(this).attr('id'));
	});		
	
	if($("#overrideTypeDropdown").val() === "Emergency Image"){
		location = "Emergency";
	} else {
		location = "IPTV";
		channel = $("#iptvDropdown").val();
	}
	
	var data = {
		"state": $("#overrideSwitchOn").prop('checked'),
		"piDees" : piDees,
		"location" : location,
		"channel" : channel
	};
	
	$.ajax({
		url: "http://dsdev.vader.jsc.nasa.gov:8080",
		type: "POST",
		contentType:'application/json',
		data: JSON.stringify(data),
		timeout: 2000,
		success: function(data, textStatus, jqXHR){	
			console.log(data);
			if(data.indexOf('ERROR') == -1){
				$('#statusModalTitle').html('Succesfully Sent Overrides');
				$('#statusModal').foundation('reveal', 'open');
			} else {
				showErrorModal();						
			}
		},
		error: function(jqXHR, textStatus, errorThrown){
			showErrorModal();
			console.log(errorThrown);
		}
	});	
});

function getPiStatus(){
	$('.statuslabel').each(function(index){
		var ip = $(this).attr('id');
		var self = this;
		data = {"jsonrpc":"2.0","id":1,"method":"Player.GetItem","params":{"playerid":1}}
		
		$.ajax({
			url: "http://"+ip+"/jsonrpc",
			type: "POST",
			contentType:'application/json',			
			data: JSON.stringify(data),
			timeout: 10000,
			success: function(data, textStatus, jqXHR){	
				console.log(data);
				if(data.error){
					$(self).removeClass('secondary')
						   .removeClass('success')
						   .addClass('alert');
					$(self).html('Not Playing');
				} else {
					$(self).removeClass('secondary')
						   .removeClass('alert')
						   .addClass('success');
					$(self).html('online');
				}
			},
			error: function(jqXHR, textStatus, errorThrown){
				console.log(jqXHR);
				$(self).removeClass('success')
					   .removeClass('alert')
					   .addClass('secondary');
				$(self).html('offline');
			}
		});			
	});
}
$(document).ready(function(){
	//getPiStatus();
	window.setInterval(getPiStatus(),10000);
});
