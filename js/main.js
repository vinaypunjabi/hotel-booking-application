$(document).ready(function () {
    var checkin_date = $('input[name="checkin_date"]');
    checkin_date.datepicker({
        format: 'mm/dd/yyyy',
        todayHighlight: true,
        autoclose: true,
    });

    var checkout_date = $('input[name="checkout_date"]');
    checkout_date.datepicker({
        format: 'mm/dd/yyyy',
        todayHighlight: true,
        autoclose: true,
    });

    if (typeof (localStorage) !== "undefined") {
        var fields = Object.keys(localStorage);
        $.each(fields, function (index, element) {
            var field = $("#" + element);
            if (field.hasClass("form-control")) {
                var itemValue = localStorage.getItem(element);
                if (itemValue) {
                    field.val(itemValue);
                }
            }
        });
    }

    $("input[id$='_date']").on('change',function(e){
        var checkin_date = $('#checkin_date').val();
        var checkout_date = $('#checkout_date').val();
        if (checkin_date && checkout_date){
            checkin_date = new Date(checkin_date);
            checkout_date = new Date(checkout_date);
        var daysDiff = daysCount(checkin_date, checkout_date);
        if(daysDiff<0){
            $('#date_err').removeClass('hide').addClass('error');
        }else{
            $('#date_err').removeClass('error').addClass('hide');
            if (typeof (localStorage) !== "undefined") {
                localStorage.setItem('days_count', daysDiff);
            }
        }
    }
    });
    
    $("#search_btn").on('click', function (e) {

        var reqFields = $('.form-control');
        $.each(reqFields, function (index, element) {
            var field = $(element);
            if (!field.val()) {
                field.parent().siblings(".hide").removeClass("hide").addClass("error");
            } else {
                field.parent().siblings(".error").removeClass("error").addClass("hide");

                localStorage.setItem(field.attr('id'), field.val());
            }
        });

        if ($(".error").length == 0) {
            $('#overlay').show();
            var params = `{
                            "currency": "USD",
                            "posId": "hbg3h7rf28",
                            "orderBy": "price asc, rating desc",
                            "roomOccupancies": [
                                {
                                "occupants": [
                                    {
                                    "type": "Adult",
                                    "age": 25
                                    }
                                ]
                                }
                            ],
                            "stayPeriod": {
                                "start": "${$('#checkin_date').val()}",
                                "end": "${$('#checkout_date').val()}"
                            },
                            "bounds": {
                                "circle": {
                                "center": {
                                    "lat": 49.0097,
                                    "long": 2.5479
                                },
                                "radiusKm": 50.5
                                }
                            }
                        }`;

            var params2 = `{
                        "sessionId": "",
                        "paging": {
                        "pageNo": 1,
                        "pageSize": 500,
                        "orderBy": "price asc, rating desc"
                        },
                        "optionalDataPrefs": [
                        "All"
                        ],
                        "currency": "USD",
                        "contentPrefs": [
                        "Basic",
                        "Activities",
                        "Amenities",
                        "Policies",
                        "AreaAttractions",
                        "Descriptions",
                        "Images",
                        "CheckinCheckoutPolicy",
                        "All"
                        ],
                        "filters": {
                        "minHotelPrice": 1,
                        "maxHotelPrice": 10000,
                        "minHotelRating": 1,
                        "maxHotelRating": 5,
                        "hotelChains": [
                            "Novotel",
                            "Marriott",
                            "Hilton",
                            "Accor"
                        ],
                        "allowedCountry": "FR"
                        }
                    }`;

            var session_id;
            $.ajax({
                type: 'POST',
                url: 'https://public-be.oski.io/hotel/v1.0/search/init',
                headers: {
                    'Content-Type': 'application/json',
                    'oski-tenantId': 'Demo'
                },
                data: params,
                dataType: 'json',
                async: true
            }).done(function (res) {
                session_id = res.sessionId;
                setTimeout(function () {
                    $.ajax({
                        type: 'POST',
                        url: 'https://public-be.oski.io/hotel/v1.0/search/status',
                        headers: {
                            'Content-Type': 'application/json',
                            'oski-tenantId': 'Demo'
                        },
                        data: JSON.stringify(res),
                        dataType: 'json',
                        async: true
                    }).done(function (result) {
                        console.dir(result);
                        var temp = JSON.parse(params2);
                        temp.sessionId = session_id;
                        params2 = temp;
                        setTimeout(function () {
                        $.ajax({
                                type: 'POST',
                                url: 'https://public-be.oski.io/hotel/v1.0/search/results',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'oski-tenantId': 'Demo'
                                },
                                data: JSON.stringify(params2),
                                dataType: 'json',
                                async: true
                            }).done(function (result) {
                                if (typeof (result) !== "undefined") {
                                    $("#search_results").html("");
                                    var total_days = localStorage.getItem('days_count');
                                    result.hotels.forEach(function (hotel) {  
                                        var geoApi = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${hotel.geoCode.lat},${hotel.geoCode.long}&sensor=true&key=AIzaSyBSAB9vkCr4WLsmofo7jsRZG10OFyZtDbE`;
                                        fetch(geoApi)
                                            .then(response => response.json())
                                            .then((result) => {
                                                var address = result.results[0].formatted_address;
                                                $("#search_results").append(`<div class="col-lg-3 col-md-6 mb-4">
                                                            <div class="card">
                                                                <img class="card-img-top" src="${hotel.images[0].url}" width="192" height="120" alt="${hotel.name}">
                                                                    <div class="card-body">
                                                                        <h4 class="card-title">${hotel.name}</h4>
                                                                        <p class="card-text">${address}</p>
                                                                        ${[1,1,1,1,1].map(function(star,index){
                                                                            if(index<hotel.rating){
                                                                                return `<span class="fa fa-star checked"></span>`;
                                                                            }else{
                                                                                return `<span class="fa fa-star"></span>`;
                                                                            }
                                                                            
                                                                        }).join("")}
                                                                    </div>
                                                                    <div class="card-footer">
                                                                        <span class="field-blk card-text"><small>from </small><b>$${hotel.fare.baseFare}<b><small>/night</small></span>
                                                                        <br><span class="field-blk card-text"><small>Total: $${(total_days * hotel.fare.baseFare).toFixed(2)}</small></span>
                                                                        <a href="#" class="btn btn-primary">Show Rooms</a>
                                                                    </div>
                                                        </div>
                                                            </div>`);
                                                $('#overlay').hide();
                                                window.scrollTo(0, $('#search_results').height());

                                            });

                                    });

                                }
                            }).fail(function (result) {
                                var noresults = `<p class="card-text">Sorry no hotels are available for selected dates. Please select different dates to proceed further.</p>`;
                                $("#search_results").html(noresults);
                                $('#overlay').hide();
                            });
                        }, 2000);
                    }).fail(function (result) {
                        var noresults = `<p class="card-text">Sorry no hotels are available for selected dates. Please select different dates to proceed further.</p>`;
                        $("#search_results").html(noresults);
                        $('#overlay').hide();
                    });

                }, 2000);

            }).fail(function (data) {
                var noresults = `<p class="card-text">Sorry no hotels are available for selected dates. Please select different dates to proceed further.</p>`;
                $("#search_results").html(noresults);
                $('#overlay').hide();
            });

        }

    });
});


function daysCount(checkin, checkout) {
    // The number of milliseconds in one day
    var ONEDAY = 1000 * 60 * 60 * 24;
    // Convert both dates to milliseconds
    var date1_ms = checkin.getTime();
    var date2_ms = checkout.getTime();
    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;

    // Convert back to days and return
    return Math.round(difference_ms / ONEDAY);
}