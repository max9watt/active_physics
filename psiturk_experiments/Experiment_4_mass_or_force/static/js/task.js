/* task.js
 * 
 * This file holds the main experiment code.
 * 
 * Requires:
 *   config.js
 *   psiturk.js
 *   utils.js
 */


// Create and initialize the experiment configuration object
var $c = new Config(condition, counterbalance);

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc);

// Preload the HTML template pages that we need for the experiment
psiTurk.preloadPages($c.pages);

// Objects to keep track of the current phase and state
var CURRENTVIEW;
var STATE;

var score = 0;
var winnings = 0;
var start_time = 0;
var response_times = [];//Can grow if there are multiple responses

/*************************™
 * INSTRUCTIONS         
 *************************/

var Instructions = function() {

    $(".slide").hide();
    var slide = $("#instructions1");
    slide.fadeIn($c.fade);

    slide.find('.next').click(function () {
       CURRENTVIEW = new Instructions2(); 
    });
};

 var Instructions2 = function() {

    $(".slide").hide();
    var slide = $("#instructions2-"+$c.condition);
    slide.fadeIn($c.fade);

    //Present different screenshots depending on counterbalance
    if ($c.counterbalance == 0){
        $('.screenshot_response1').attr('src', 'static/images/mass_question.png');
        $('.screenshot_response2').attr('src', 'static/images/force_question.png');
        $('.screenshot_response1').next().text('Figure 1: Question about how heavy the objects are');
        $('.screenshot_response2').next().text('Figure 2: Question about the relationship between the objects');
    }else{
        $('.screenshot_response1').attr('src', 'static/images/force_question.png');
        $('.screenshot_response2').attr('src', 'static/images/mass_question.png');
        $('.screenshot_response1').next().text('Figure 1: Question about the relationship between the objects');
        $('.screenshot_response2').next().text('Figure 2: Question about how heavy the objects are');
    }
     
    slide.find('.next').click(function () {
        //CURRENTVIEW = new TestPhase(); //Enable for jumping straight to test
        CURRENTVIEW = new Comprehension(); 
    });
};

/*****************
 *  COMPREHENSION CHECK*
 *****************/
var Comprehension = function(){
// Show the slide
$(".slide").hide();
$("#comprehension_check").fadeIn($c.fade);

    //disable button initially
    $('#comprehension').prop('disabled', true);

    //checks whether all questions were answered
    $('.comprehensionQ').change(function () {
       if ($('input[name=q1]:checked').length > 0 &&
        $('input[name=q2]:checked').length > 0 &&
        $('input[name=q3]:checked').length > 0 &&
        $('input[name=q4]:checked').length > 0)
       {
        $('#comprehension').prop('disabled', false);
    }else{
        $('#comprehension').prop('disabled', true);
    }});

$('#comprehension').click(function () {           
       var q1 = $('input[name=q1]:checked').val();
       var q2 = $('input[name=q2]:checked').val();
       var q3 = $('input[name=q3]:checked').val();
       var q4 = $('input[name=q4]:checked').val();

       // correct answers 
        answers = ["correct","false","correct","correct"];

       if(q1 == answers[0] && q2 == answers[1] && q3 == answers[2] && q4 == answers[3]){
            CURRENTVIEW = new TestPhase();
       }else{
            $('input[name=q1]').prop('checked', false);
            $('input[name=q2]').prop('checked', false);
            $('input[name=q3]').prop('checked', false);
            $('input[name=q4]').prop('checked', false);
            CURRENTVIEW = new ComprehensionCheckFail();
       }
   });
};

/*****************
 *  COMPREHENSION FAIL SCREEN*
 *****************/

var ComprehensionCheckFail = function(){
// Show the slide
$(".slide").hide();
$("#comprehension_check_fail").fadeIn($c.fade);

//unbind previous function calls 
$('#comprehension').unbind();
$("#instructions1").find('.next').unbind();
$("#instructions2-0").find('.next').unbind();
$("#instructions2-1").find('.next').unbind();
$("#instructions2-2").find('.next').unbind();

$('#comprehension_fail').click(function () {           
    $('#comprehension_fail').unbind();
    CURRENTVIEW = new Instructions();
   });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*************************
 * TRIAL
 *************************/

 var TestPhase = function(){

    // debugger
    var that = this;
    this.trialinfo;    


    // Initialize a new trial. This is called either at the beginning
    // of a new trial, or if the page is reloaded between trials.
    this.init_trial = function () {
        // If there are no more trials left, then we are at the end of
        // this phase
        if (STATE.index >= $c.trials.length) { //change here for debugging
        // if (STATE.index >= 1) { //change here for debugging
            this.finish();
            return false;
        }

        // Load the new trialinfo
        this.trialinfo = $c.trials[STATE.index];
        
        // debugger
        // Update progress bar
        update_progress(STATE.index, $c.trials.length);

        return true;
    }; 

    physicsSetup = [];
    physicsEvents = [];
    physicsTimeline = [];

    clipFinished = false;

    

    //get physics data
    GetPhysicsData = function(){

        // function Pause() {
        var iframe = document.getElementById("game-frame");
        if (iframe) {
        var iframeContent = (iframe.contentWindow || iframe.contentDocument);
        physicsSetup = iframeContent.data.constants;
        physicsEvents = iframeContent.data.events;
        physicsTimeline = iframeContent.data.timeline;
        }
        
        // $('.buttons_wrap').show();
        // $('.sliders_wrap').show();

        clipFinished = true;
        EnableContinue();
    }

    this.display_stim = function (that) {

        if (that.init_trial()) {
            $('#start.next').prop('disabled', false);
            // var view = {
            //     'outcome': that.trialinfo.outcome_text
            // };
            
            console.log('that.trialinfo', that.trialinfo);

            if (that.trialinfo.question =='mass')
            {
                $('#prompt-text').html("<p><ol>"+$c.promptMass+" "+ $c.promptCondition[$c.condition]+"</ol></p><br>");
            } else if (that.trialinfo.question =='force') {
                $('#prompt-text').html("<p><ol>"+$c.promptForce+" "+ $c.promptCondition[$c.condition]+"</ol></p><br>");
            }


            //Only embed world on first trial
            if (STATE.index == 0){
                //Embed the physics world
                html = '<iframe src="physics_world.html" width=600 height=400 id="game-frame"></iframe>'; 
                $('.physics_world').html(html);
            } else{
                //Otherwise just remove the curtain
                var iframe = document.getElementById("game-frame");
                if (iframe) {
                    var iframeContent = (iframe.contentWindow || iframe.contentDocument);
                    iframeContent.RemoveCurtain();
                }
            }
            
            $('#start.next').click(function () {

                //disable start button, reveal response controls
                $('#start.next').prop('disabled', true);
				$('.buttons_wrap').show();
				$('.sliders_wrap').show();

				//Track the time(s) when the response is made
				start_time = new Date();
				respones_times = [];

                //Inner variables needed in cond
                //0 Learning condition
                //1 Local forces - array length 6 with forces for rels (AB AC AD BC BD CD)
                //2 Object masses - array length 4 with a mass for each object
                //3 Object elasticities - array length 4 with elasticity for each object
                //4 Global force strength (support:-Inf,Inf)
                //5 Global force direction (0:7 clockwise N to NW)

                var masses = [that.trialinfo.world[1],
                            that.trialinfo.world[2], 1, 1];

                var elasticities = [.98,.98,.98,.98,.98];

                var r_forces = that.trialinfo.r_forces;
                var start_vecs = that.trialinfo.start_vecs;
                var start_locs = that.trialinfo.start_locs;
                cond = {condition:1,
                		target_force:that.trialinfo.world[0],
                		nontarget_forces:r_forces,
                		global_force:0,
                		masses:masses,
                		elasticities:elasticities,
                		start_vecs:start_vecs,
                		start_locs:start_locs,
                		labels:['A','B']
                	};

                debug(['$c', $c, 'STATE', STATE, 'CURRENTVIEW', CURRENTVIEW,
                   'cond',  cond]);

                //Start the clip
                var iframe = document.getElementById("game-frame");
                if (iframe) {
                    var iframeContent = (iframe.contentWindow || iframe.contentDocument);
                    iframeContent.Start();
                }
            });
            
            $('#trial_next').prop('disabled', true);

            console.log('$c.questions', $c.questions);

            //Creates the html for the questions on the fly
            var html = "" ;

            //Choose which question is up this time
            if (this.trialinfo.question=='force') {
                k=0;
            } else if (this.trialinfo.question=='mass'){
                k=1;
            }

            //Add the question
            var q1 = $c.questions[k].q1;
            var q2 = $c.questions[k].q2;
            var q3 = $c.questions[k].q3;

            //Always display the options in alphabetical order
                html += q1 + 'A' + q2 + 'B' +   q3 + '<br>';


            //Add the answers
            for (var j=0; j<$c.questions[k].l.length; j++){
                //console.log('inside loop', k, j, $c.questions[k].l[j])
                var ans = $c.questions[k].l[j];
                //console.log('ans',k,j, ans);
                
                //A workaround for updating the letters on the balls in the answers for mass q for each problem
                // if (k==1 && j==0){ ans = this.trialinfo.labels[0] + ans;}
                // if (k==1 && j==2){ ans = this.trialinfo.labels[1]+ ans;}

                html += '<input type = "radio" name = "' + $c.questions[k].type +
                 '" value = "' + $c.questions[k].v[j] +
                  '" class = "answer_buttons ' + $c.questions[k].type + '" >' +
                   ans + '&nbsp;&nbsp;&nbsp;';    
        	}
 


            //console.log(html);
            
            //Assign it to the buttons wrap
            $('.buttons_wrap').html(html) ;
            
            //disable buttons 
            //$(".answer_buttons").prop('disabled',true);
            //$(".slider").prop('disabled', true);
            
            //Initially hide the wrap
            $('.buttons_wrap').hide();



            //check on a click on one of the button options if conditions are met to continue 
            $(".answer_buttons").click(function()
            { 
                EnableContinue();
                cur_time = new Date();

                var tmp = cur_time - start_time;
                if (tmp>30000) {tmp==30000}
                console.log('time', tmp);
                response_times.push(tmp);
            });            

            //confidence sliders
            var html = "" ; 

            var q = $c.sliders[k].q;
            html += q + '<div class="slider s-'+k+'"></div><div class="l-'+0+'"></div>' ;
            if (i == 0){
                html += '<br><br>'
            }else{
                html += '<br>'
            }
            
            //console.log(html);

            $('.sliders_wrap').html(html) ;

            $('.sliders_wrap').hide();

            // Create the slider
            $('.s-'+k).slider().on("slidestart", function( event, ui ) {
	            // Show the handle
	            $(this).find('.ui-slider-handle').show() ;
            });
                                   
            //Add the generic labels to the sliders
            $('.l-'+k).append("<label style='width: 33%'>"+ $c.sliders[k].l[0] +"</label>") ; 
            $('.l-'+k).append("<label style='width: 33%'>"+ $c.sliders[k].l[1] +"</label>") ; 
            $('.l-'+k).append("<label style='width: 33%'>"+ $c.sliders[k].l[2] +"</label>");


            // Hide all the slider handles 
            $('.ui-slider-handle').hide() ;

            //check that all buttons were clicked 
            $(".slider").click(function()
            { 
                EnableContinue();
            });           

            //check whether all conditions for enabling the continue button are met
            EnableContinue = function(){
                $(".answer_buttons").prop('disabled',false) //enable buttons
                
                //check for button presses 
                var sum = 0;
                for (var j=0; j<$c.questions.length; j++) {
                    if ($('.' + $c.questions[j].type).is(':checked')){
                        sum++;
                    }
                }

                //check for slider clicks 
                var sum1 = 0 ;
                for (var j=0; j<$c.sliders.length; j++) {
                    if ($('.s-'+j).find('.ui-slider-handle').is(":visible")) {
                        sum1++ ;
                    }
                }

                if (sum == 1 & sum1 == 1 & clipFinished==true) {
                    $('#trial_next').prop('disabled', false) ;
                    clipFinished = false;
                }
                //$c.sliders.length
                console.log('clipFinished', clipFinished, 'sum', sum, '$c.questions.length', $c.questions.length)
            }
        }       
    };

    this.record_response = function() {      
         
        
        var buttons = [];
        var sliders = [];
        if (that.trialinfo.question=='force')
        {
        	sliders.push($c.sliders[0].type, $('.s-0').slider('value'));
        	buttons.push($c.questions[0].type, $('.' + $c.questions[0].type  + ':checked').val());
        } else if (that.trialinfo.question=='mass'){
        	sliders.push($c.sliders[1].type, $('.s-1').slider('value'));
        	buttons.push($c.questions[1].type, $('.' + $c.questions[1].type  + ':checked').val());
        }
        


        console.log([
            "ID", this.trialinfo.ID, 
            "world", this.trialinfo.world, 
            "buttons", buttons,
            "sliders", sliders,
            "labels", this.trialinfo.labels,
            "response_time", response_times[response_times.length-1],
            "other_forces", this.trialinfo.r_forces,
            "starting_locs",this.trialinfo.starting_locs,
            "starting_vecs", this.trialinfo.starting_vecs,
            "setup", physicsSetup, 
            "timeline", physicsTimeline, 
            "events", physicsEvents]);


        psiTurk.recordTrialData([
            "ID", this.trialinfo.ID, 
            "world", this.trialinfo.world, 
            "buttons", buttons,
            "sliders", sliders,
            "labels", this.trialinfo.labels,
            "response_time", response_times[response_times.length-1],
            "other_forces", this.trialinfo.r_forces,
            "starting_locs",this.trialinfo.starting_locs,
            "starting_vecs", this.trialinfo.starting_vecs,
            "setup", physicsSetup, 
            "timeline", physicsTimeline, 
            "events", physicsEvents]);
        
        //unbind start function to avoid multiple function calls 
        $('#start.next').unbind( "click" );

        STATE.set_index(STATE.index + 1);

        if (buttons[0]=='relationship')
        {
        	if (buttons[1]=='attract' & this.trialinfo.world[0]==3)
        	{
        		score++;
        		winnings = winnings + (1-response_times[response_times.length-1]/30000)*5 + 5;//Note fix this for responses after 30+ seconds using a 'max'
        		console.log('attract correct', buttons, this.trialinfo);
        	} else if (buttons[1]=='none' & this.trialinfo.world[0]==0)
        	{
        		winnings = winnings + (1-response_times[response_times.length-1]/30000)*5 + 5;
        		score++;
        		console.log('none correct', buttons, this.trialinfo);
        	} else if (buttons[1]=='repel' & this.trialinfo.world[0]==(-3))
        	{
        		winnings = winnings + (1-response_times[response_times.length-1]/30000)*5 + 5;
        		score++;
        		console.log('repel correct', buttons, this.trialinfo);
        	} else {
        		console.log('relationship wrong',  buttons, this.trialinfo.world);
        	}
        }

        if (buttons[0]=='mass')
        {
        	if (buttons[1]=='A' & this.trialinfo.world[1]==2 & this.trialinfo.world[2]==1)
        	{
        		winnings = winnings + (1-response_times[response_times.length-1]/30000)*5 + 5;
        		score++;
        		console.log('A correct', buttons, this.trialinfo);
        	} else if (buttons[1]=='same' & this.trialinfo.world[1]==1 & this.trialinfo.world[2]==1)
        	{
        		winnings = winnings + (1-response_times[response_times.length-1]/30000)*5 + 5;
        		score++;
        		console.log('same correct', buttons, this.trialinfo);
        	} else if (buttons[1]=='B'  & this.trialinfo.world[1]==1 & this.trialinfo.world[2]==2 & this.trialinfo.labels[0]=='A')
        	{
        		winnings = winnings + (1-response_times[response_times.length-1]/30000)*5 + 5;
        		score++;
        		console.log('B correct', buttons, this.trialinfo);
        	} else {
        		console.log('mass wrong',  buttons, this.trialinfo);
        	}
        }
        // var score_check = [];
        // if (buttons[1]=='attract') {score_check[0]=3;}
        // if (buttons[1]=='none') {score_check[0]=0;}
        // if (buttons[1]=='repel') {score_check[0]=-3;}
        // if (buttons[3]=='A' & this.trialinfo.labels[0]=='A') {score_check[1]=2; score_check[2]=1;}
        // if (buttons[3]=='B' & this.trialinfo.labels[0]=='B') {score_check[1]=2; score_check[2]=1;}
        // if (buttons[3]=='same') {score_check[1]=1; score_check[2]=1;}
        // if (buttons[3]=='B' & this.trialinfo.labels[0]=='A') {score_check[1]=1; score_check[2]=2;}
        // if (buttons[3]=='A' & this.trialinfo.labels[0]=='B') {score_check[1]=1; score_check[2]=2;}

        // if (score_check[0]==that.trialinfo.world[0]) {score++;}
        // if (score_check[1]==that.trialinfo.world[1] & score_check[2]==that.trialinfo.world[2]) {score++;}

        // console.log("Score here: buttons", buttons, "accumulated score", score, 'score_check', score_check,
        //     "sliders", sliders, 'physicsSetup', physicsSetup, physicsSetup.length);


        // Update the page with the current phase/trial
        this.display_stim(this);
    };

    this.finish = function() {
        // CURRENTVIEW = new Demographics();
        CURRENTVIEW = new PerformanceFeedback();
    };

    // Load the trial html page
    $(".slide").hide();

    // Show the slide
    var that = this; 
    $("#trial").fadeIn($c.fade);
    $('#trial_next.next').click(function () {
        that.record_response();
    });

    // Initialize the current trial
    if (this.init_trial()) {
        // Start the test
        this.display_stim(this) ;
    };
}

/*****************
 *  PERFORMANCE FEEDBACK*
 *****************/

var PerformanceFeedback = function(){
// Show the slide
$(".slide").hide();
$("#performance_feedback").fadeIn($c.fade);
 html = "<p>You've answered " + score +
 " out of 20 questions correctly.</p><p>Your bonus is <b>" + Math.round(winnings) + " cents</b>.</p>";

$('.feedback_text').html(html) ;

//5 cents per correct answer
psiTurk.recordUnstructuredData("winnings", winnings); //task bonus

$('#feedback').click(function () {           
  CURRENTVIEW = new Demographics();
   });
};

/*****************
 *  DEMOGRAPHICS*
 *****************/

 var Demographics = function(){

    var that = this; 

// Show the slide
$(".slide").hide();
$("#demographics").fadeIn($c.fade);

    //disable button initially
    $('#trial_finish').prop('disabled', true);

    //checks whether all questions were answered
    $('.demoQ').change(function () {
       if ($('input[name=sex]:checked').length > 0 &&
         $('input[name=age]').val() != "")
       {
        $('#trial_finish').prop('disabled', false)
    }else{
        $('#trial_finish').prop('disabled', true)
    }
});

// deletes additional values in the number fields 
$('.numberQ').change(function (e) {    
    if($(e.target).val() > 100){
        $(e.target).val(100)
    }
});

this.finish = function() {
    debug("Finish test phase");

        // Show a page saying that the HIT is resubmitting, and
        // show the error page again if it times out or error
        var resubmit = function() {
            $(".slide").hide();
            $("#resubmit_slide").fadeIn($c.fade);

            var reprompt = setTimeout(prompt_resubmit, 10000);
            psiTurk.saveData({
                success: function() {
                    clearInterval(reprompt); 
                    finish();
                }, 
                error: prompt_resubmit
            });
        };

        // Prompt them to resubmit the HIT, because it failed the first time
        var prompt_resubmit = function() {
            $("#resubmit_slide").click(resubmit);
            $(".slide").hide();
            $("#submit_error_slide").fadeIn($c.fade);
        };

        // Render a page saying it's submitting
        psiTurk.showPage("submit.html") ;
        psiTurk.saveData({
            success: psiTurk.completeHIT, 
            error: prompt_resubmit
        });
    }; //this.finish function end 

    $('#trial_finish').click(function () {           
       var feedback = $('textarea[name = feedback]').val();
       var sex = $('input[name=sex]:checked').val();
       var age = $('input[name=age]').val();

       psiTurk.recordUnstructuredData('feedback',feedback);
       psiTurk.recordUnstructuredData('sex',sex);
       psiTurk.recordUnstructuredData('age',age);
       that.finish();
   });
};


// --------------------------------------------------------------------

/*******************
 * Run Task
 ******************/

 $(document).ready(function() { 
    // Load the HTML for the trials
    psiTurk.showPage("trial.html");

    // Record various unstructured data
    psiTurk.recordUnstructuredData("condition", condition);
    psiTurk.recordUnstructuredData("counterbalance", counterbalance);

    //save the column names
    psiTurk.recordUnstructuredData("setupNames", $c.setupNames);
    psiTurk.recordUnstructuredData("timelineNames", $c.timelineNames);
    psiTurk.recordUnstructuredData("eventNames", $c.eventNames);

    // Start the experiment
    STATE = new State();
    // Begin the experiment phase
    if (STATE.instructions) {
        CURRENTVIEW = new Instructions();
    }
});
