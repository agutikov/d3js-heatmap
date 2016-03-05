var width = 900,
    height = 105,
    cellSize = 12; // cell size
    week_days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
	
var day = d3.time.format("%w"),
    week = d3.time.format("%U"),
    percent = d3.format(".1%"),
	format = d3.time.format("%Y%m%d");
	parseDate = d3.time.format("%Y%m%d").parse;
		
var color = d3.scale.linear().range(["white", '#002b53'])
    .domain([0, 1])
    
var svg = d3.select(".calender-map").selectAll("svg")
    .data(d3.range(2015, 2017))
  .enter().append("svg")
    .attr("width", '100%')
    .attr("data-height", '0.5678')
    .attr("viewBox",'0 0 900 105')
    .attr("class", "RdYlGn")
  .append("g")
    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

svg.append("text")
    .attr("transform", "translate(-38," + cellSize * 3.5 + ")rotate(-90)")
    .style("text-anchor", "middle")
    .text(function(d) { return d; });
 
for (var i=0; i<7; i++)
{    
svg.append("text")
    .attr("transform", "translate(-5," + cellSize*(i+1) + ")")
    .style("text-anchor", "end")
    .attr("dy", "-.25em")
    .text(function(d) { return week_days[i]; }); 
 }

var rect = svg.selectAll(".day")
    .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter()
	.append("rect")
    .attr("class", "day")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("x", function(d) { return week(d) * cellSize; })
    .attr("y", function(d) { return day(d) * cellSize; })
    .attr("fill",'#fff')
    .datum(format);

var legend = svg.selectAll(".legend")
      .data(month)
    .enter().append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (((i+1) * 50)+8) + ",0)"; });

legend.append("text")
   .attr("class", function(d,i){ return month[i] })
   .style("text-anchor", "end")
   .attr("dy", "-.25em")
   .text(function(d,i){ return month[i] });
   
svg.selectAll(".month")
    .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("path")
    .attr("class", "month")
    .attr("id", function(d,i){ return month[i] })
    .attr("d", monthPath);

Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};

d3.json("1.json", function (error, json) {

    if (error) return window.alert("Error loading json data");

    json.forEach(function(d) {
        var tm = new Date(d.created_at)
        var y = tm.getFullYear()
        var m = tm.getMonth()
        var day = tm.getDate()
        d.date = new Date(y, m, day)
        d.next_date = new Date(y, m, day+1)
        d.datestr = d.date.yyyymmdd();
        d.timestamp = new Date(d.created_at)
    });

    Max_Value = 3600*24;

    var data = d3.nest()
    .key(function(d) { return d.datestr; })
    .rollup(function(v) {

        var sd = v.sort(function(d){return d.timestamp.getTime()});

        var enabled_total_sec = 0

        var first = sd[0]
        if (first.value == "off") {
            //console.log(first.datestr, first.date, first.timestamp)
            enabled_total_sec += first.timestamp.getTime() - first.date.getTime()
        }

        var last = sd.slice(-1)[0]
        if (last.value == "on") {
            enabled_total_sec += last.next_date.getTime() - last.timestamp.getTime()
            //console.log(first.datestr, last.timestamp, last.next_date, (last.next_date.getTime() - last.timestamp.getTime())/1000/3600)
        }

        var a = sd.slice(1)
        for (i = 0; i < a.length; i++) {
            if (a[i].value == "off") {
                enabled_total_sec += a[i].timestamp.getTime() - sd[i].timestamp.getTime()
                //console.log(first.datestr, sd[i].timestamp, a[i].timestamp, (a[i].timestamp.getTime() - sd[i].timestamp.getTime())/1000/3600)
            }
        }

        if (enabled_total_sec/1000 > Max_Value) {
            for (i = 0; i < sd.length; i++) {
                console.log(sd[i].datestr, sd[i].value, sd[i].timestamp, sd[i].date, sd[i].next_date)
            }
            console.log(first.datestr, Math.floor(enabled_total_sec/1000))
        }

        return [first.date, Math.floor(enabled_total_sec/1000)];
    })
    .map(json);

    rect.filter(function(d) { return d in data; })
    .attr("fill", function(d) { return color(data[d][1] / Max_Value); })
    .attr("data-title", function(d) {
        var val = data[d][1]
        var msg = data[d][0].toDateString() + "    " +  val + "  -  " + Math.floor(val / 3600) + "h " + Math.floor((val % 3600) / 60) + "m " + (val % 60) + "s";
        return msg;
    } );
    $("rect").tooltip({container: 'body', html: true, placement:'top'}); 
});

function numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
}

function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}
