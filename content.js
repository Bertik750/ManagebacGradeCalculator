jQuery(document).ready(function() {
    chrome.storage.sync.get(['settings'], function(result) {
        settings = result.settings;
        if(settings.gc) {
            clearInterval(checkExist);

            var categories = []; //category array

            var studentClass = $('.content-block-header h3').text();
            var studentClass1 = studentClass;

            var checkExist = setInterval(function() {
                if ($('.highcharts-axis').length && $('#result').length == 0) {
                    clearInterval(checkExist);
                    console.log("Exists!");
                    calculate();
                    $('.nav:nth-child(4) > li:nth-child(2) > a')[0].click();
                } else if ($('.highcharts-axis').length && $('#result').length && studentClass !== studentClass1) {
                    clearInterval(checkExist);
                    $('.nav:nth-child(4) > li:nth-child(2) > a')[0].click();
                }
            }, 32)

            let blueSum =0; //4 categories per assigement grading system
            let assigements =0; //4 categories per assigement grading system
            function calculate() {

                //check if grade calculated by MB
                let mbCalculated;
                $('.table tbody tr').each(function(i) {
                    if ($(this).children().first().text().indexOf('Overall') > -1) {
                        mbCalculated = true;
                    }
                })
                //Creates categories
                if (mbCalculated) { //older, different version of managebac (probably not used anymore)
                    $('.table tbody tr').each(function(i) {
                        if ($(this).children().first().text().indexOf('Overall') < 0) {
                            var cat = {} //category object
                            var title = $(this).children().first().text();
                            cat.name = title.slice(0, -5); //gets category name
                            cat.weight = Number(title.substr(title.length - 5).replace(/[^0-9.]/g, "")); //gets category weight
                            cat.grades = getGrade(cat.name) //gets category gradesid.substr(id.length - 5);
                            cat.avg = getAvg(cat.grades) //gets avarage of category
                            cat.specialNum = cat.avg * cat.weight / 100; //creates the number for §uclating the final grade
                            categories.push(cat) //puts category into array
                        }
                    })
                } else if($('.label-blue').length) { //4 categories per assigement grading system (no weights)
                    blueSum +=1; //prevent error when no assigement yet...
                    $('.label-blue').each(function(i) {
                        if($.isNumeric($(this).html())) {
                            blueSum += parseInt($(this).html(), 10);
                            assigements += 1;
                        }
                    })
                } else if($('.sidebar-items-list').length) { //Standard most precise search alogorithm
                    $('.sidebar-items-list .list-item:not(.list-item-head)').each(function(i) { //most current version
                        var cat = {} //category object
                        cat.name = $(this).children().first().text(); //gets category name
                        cat.weight = Number($(this).children().eq(1).text().replace(/[^0-9]+/g, '')); //gets category weight
                        cat.grades = getGrade(cat.name) //gets category grades
                        cat.avg = getAvg(cat.grades) //gets avarage of category
                        cat.specialNum = cat.avg * cat.weight / 100; //creates the number for caluclating the final grade
                        categories.push(cat) //puts category into array
                    })
                } else { //More universal search algorithm
                    const perts = $('section :contains("%")').filter(function() { return $(this).children().length === 0;});

                    for(let i=0; i<perts.length; i++) {
                        var cat = {} //category object
                        cat.name = $(perts[i]).parent().find('.label').text() //gets category name
                        cat.weight = Number($(perts[i]).text().replace(/[^0-9]+/g, '')); //gets category weight
                        cat.grades = getGrade(cat.name) //gets category grades
                        cat.avg = getAvg(cat.grades) //gets avarage of category
                        cat.specialNum = cat.avg * cat.weight / 100; //creates the number for caluclating the final grade
                        categories.push(cat) //puts category into array
                    } 
                }

                //gets category grades
                function getGrade(cat) {
                    var grades = [];
                    $('.label-score').each(function(i) {
                        if (cat.indexOf($(this).parent().parent().children().last().text()) > -1) {
                            var a = $(this).text();
                            var b = a.split('/').map(function(item) {
                                return parseInt(item, 10);
                            });
                            grades.push(Math.round(b[0] / b[1] * 100 * 100) / 100);
                        }
                    })
                    return grades;
                }

                //creates a avarage from array
                function getAvg(grades) {
                    var sum = 0;
                    for (var i = 0; i < grades.length; i++) {
                        sum += parseInt(grades[i], 10);
                    }
                    return sum / grades.length;
                }

                //calculates the final result
                function fresult() {
                    var sumWeight = 0;
                    var sumSpecial = 0;
                    for (var i = 0; i < categories.length; i++) {
                        if (isNaN(categories[i].avg)) { //checks if category has some grades in it
                            //console.log("NAN" + categories[i].name);
                        } else {
                            sumWeight += categories[i].weight;
                        }
                    }
                    for (var i = 0; i < categories.length; i++) {
                        if (isNaN(categories[i].avg)) {
                            //console.log("NAN" + categories[i].name);
                        } else {
                            sumSpecial += categories[i].specialNum;
                        }
                    }
                    let finalGrade = Math.round(sumSpecial / sumWeight * 1000) / 10;
                    if(isNaN(finalGrade)) {
                        finalGrade = "An error has occured or you are using an unsupported grade system. Please contact the developer (13skarupa@opengate.cz). Switch off grade calculation in the settings to use the other features";
                    }
                    return finalGrade + "%";
                }

                //This creates the red result
                var result = document.createElement('h3');
                result.style.color = "red";
                result.style.marginTop = "10px";
                result.style.float = "right";
                result.id = "result";
                if(blueSum === 0) {
                    result.innerHTML = "Grade: " + fresult();
                } else {
                    result.innerHTML = "Average points per assigement: " + Math.round(((blueSum-1) / (assigements / 4)) * 100) / 100;
                }
                $('.content-block > h3:nth-child(3)').append(result);


                //The code that creates the table in the bottom (mix of jQuery and default javascript -_-)
                var body = $('main').children().last().children();
                var info = document.createElement('h4');
                info.innerHTML = "You can change the grades in this table and calculate your grade again:";

                var tbl = document.createElement('table');
                tbl.setAttribute('id', 'gradeChart');
                tbl.setAttribute('border', '1');
                tbl.style.margin = '20px 0px';
                var tbdy = document.createElement('tbody');

                if(blueSum < 1) {
                    body.append(info);
                    tbl.append(tbdy);
                    body.append(tbl);
                }
                for (var i = 0; i < categories.length; i++) {
                    $('#gradeChart > tbody:last-child').append('<tr id="' + categories[i].name.replace(/[^a-z0-9]/gi, '') + 'tr"><td style="padding: 5px;">' + categories[i].name + '</td><td style="padding: 5px;">' + categories[i].weight + '%</td></tr>');

                    for (var k = 0; k < categories[i].grades.length; k++) {
                        $('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><input class="gradeInput' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '" style="width:40px" value="' + categories[i].grades[k] + '"></td>')
                        if (k == categories[i].grades.length - 1) {
                            //$('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><input class="gradeInput' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '" style="width:40px"></td>')
                            $('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><button class="plus" id="' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '">+</button></td>')

                        }
                    }
                    if (categories[i].grades.length == 0) {
                        $('#gradeChart > tbody > tr:last-child').append('<td style="padding: 5px;"><button class="plus" id="' + categories[i].name.replace(/[^a-z0-9]/gi, '') + '">+</button></td>')
                    }
                }

                $('#gradeChart').on("click", ".plus", function() {
                    $('#' + this.id + 'tr td:last').before('<td style="padding: 5px;"><input class="gradeInput' + this.id + '" style="width:40px"></td>');
                });

                var but = document.createElement('button');
                var text = document.createTextNode("Calculate");
                but.setAttribute('id', 'calculateButton');
                but.append(text);
                body.append(but);

                $('#calculateButton').click(function() {
                    gradeTableToObject();
                    $('#result2').remove();
                    $('.content-block:last').append('<h2 id="result2">Grade: ' + fresult() + '</h2>')
                });

                //creates the categories from the table to calculate the final grade
                function gradeTableToObject() {
                    categories = [];
                    $('#gradeChart tbody tr').each(function(i) {
                        var cat = {};
                        cat.name = $(this).children().first().text();
                        cat.weight = Number($(this).children().eq(1).text().replace(/[^0-9]+/g, ""));
                        cat.grades = getGrade1(cat.name)
                        cat.avg = getAvg(cat.grades)
                        cat.specialNum = cat.avg * cat.weight / 100;
                        categories.push(cat);
                    })
                }

                //gets grades from table
                function getGrade1(name) {
                    var grades = [];
                    $('.gradeInput' + name.replace(/[^a-z0-9]/gi, '')).each(function(i) {
                        if ($(this).val() != '') {
                            grades.push($(this).val())
                        }
                    })
                    return grades;
                }
            }

            var school = $(".school-name").text();
            chrome.runtime.sendMessage({
                whatSchool: school
            });
        }
    });
    

});