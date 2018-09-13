$.ajax({
    url: '/accounts/degree_plan_view',
    success: function(data) {
        let codes = data.split(",");
        let tableBody = $('#codes-table').find('tbody');
        for (var i = 0; i < codes.length; i++) {
            tableBody.append('<tr><td>' + codes[i] + '</td></tr>');
        }
    }
})
