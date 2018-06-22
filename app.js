// pie chart component
Vue.component("pie-chart", {

	// extend
	extends: VueChartJs.Pie,

	// define props
	props: ['data','animate'],

	// set fixed options for this component
	methods: {
		options(){
			return {
				responsive: true,
				maintainAspectRatio: true,
				tooltips: {
					enabled: false
				},
				animation: {
					duration: (this.animate) ? 1000 : 0
				},
				legend: {
					onClick: function() { return; },
					position: 'bottom',
					labels: {
						boxWidth: 16,
						fontColor: '#888',
						fontSize: 13
					}
				},
			};
		}
	},

	// init render
	mounted() {
		this.renderChart(this.data, this.options());
	},

	// if any prop changes, render the chart again
	watch: {
		data: function() {
			this._chart.destroy();
			this.renderChart(this.data, this.options());
		},
		animate: function() {
			this._chart.destroy();
			this.renderChart(this.data, this.options());
		}
	}

});

// calculator
new Vue({

	// id
	el: '#calculator',

	// define data props with default values
	data: {
		price: '$300,000',
		upfront: 20,
		rate: 4.5,
		term: 30,
		terms: [
			{ text: '15 year fixed', value: 15 },
			{ text: '20 year fixed', value: 20 },
			{ text: '30 year fixed', value: 30 }
		],
		visible: false,
		animate: false,
		button: 'Save Settings'
	},

	// methods
	methods: {

		// format value to currency
		toCurrency(value, cents = 2) {

			// if invalid, return two en dashes
			if (isNaN(value) || !isFinite(value)) return '&ndash;&ndash;';

			// else make it pretty and return
			return '$' + value.toFixed(cents).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");

		},

		// validate the rate
		checkRate(){

			// remove non numeric chars (except decimal)
			var value = String(this.rate).replace(/[^0-9.]/g, '');

			// if value is empty or invalid, set to 0
			if (value == '' || isNaN(value)) value = '0';

			// if first char is decimal, add a leading zero
			if (value.charAt(0) == '.') value = '0' + value;

			// update the value (max is 100)
			this.rate = (value < 100) ? value : '100';

		},

		// validate the price
		checkPrice() {

			// remove leading zeros and non numeric chars (except decimal)
			var value = String(this.price).replace(/[^0-9.]/g, '').replace(/^0+/, '');

			// limit to no more than 2 decimal places
			if (value.includes('.')) {
				if (value.split('.')[1].length > 2) value = value.slice(0, -1);
			}

			// if the value is invalid, just display dollar sign and return
			if (value == '' || isNaN(value)) {
				this.price = '$';
				return;
			}

			// else make it pretty
			this.price = '$' + String(value).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");

		},

		// check price when the field loses focus
		onBlurPrice(){

			// if value is less than two chars, set it to '$0'
			if (this.price.length < 2) this.price = '$0';

		},

		// reveal the app when ready
		reveal() {

			// if the app is already visible, return
			if (this.visible) return;

			// set to visible
			this.visible = true;

			// trigger chart animation
			this.animate = true;

			// reset animation back to false so it doesn't fire again
			var that = this;
			setTimeout(function(){
				that.animate = false;
			}, 1000);

		},

		// save user settings
		saveSettings() {

			// define resource url
			var url = 'http://p0zzz.mocklab.io/session/2';

			// test failure
			// var url = 'https://httpstat.us/404';

			// prepare the data
			var data = {
				amount: this.priceInt,
				rate: this.rate / 100,
				amortization_period_years: this.term,
				down_payment_percent: this.upfront
			};

			// config headers
			var config = {
				headers: {
					'Accept': 'application/json'
				}
			};

			// query the api
			this.$http.put(url, data, config).then(function(response){
				this.button = 'Saved!';
			}, function(response){
				this.button = 'Error!';
			});

		}

	},

	// calculations
	computed: {

		// price as int (remove currency formatting)
		priceInt: function(){
			var price = parseFloat(String(this.price).replace(/[^0-9.]/g, ''));
			return (isNaN(price)) ? 0 : price;
		},

		// down payment = price * (upfront / 100)
		down: function(){
			return this.priceInt * (parseInt(this.upfront) / 100);
		},

		// loan amount = price - down payment
		loan: function(){
			return this.priceInt - this.down;
		},

		// months = term * 12
		months: function(){
			return this.term * 12;
		},

		// monthly payment calc
		payment: function(){
			var P = this.loan;
			var r = parseFloat(this.rate / 1200);
			var N = parseInt(this.months);
			return (r == 0) ? P / N : P * (r * Math.pow((1 + r), N)) / (Math.pow((1 + r), N) - 1);
		},

		// total mortgage cost = months * monthly payment + down payment
		total: function(){
			return this.months * this.payment + this.down;
		},

		// total interest payable = total cost - down payment - loan amount
		interest: function(){
			return this.total - this.down - this.loan;
		},

		// define chart data
		chartData: function(){

			// if price is zero
			if (this.priceInt == 0) {
				var data   = [100,0,0];
				var colors = '#f0f0f0';
			}

			// else if price > zero
			else {
				var data   = [this.down, this.loan, this.interest];
				var colors = ['#29b6f6','#b3e5fc','#01579b'];
			}

			// return chart data
			return {
				labels: ["Down payment","Principal","Interest"],
				datasets: [{
					backgroundColor: colors,
					borderColor: "#fff",
					borderWidth: 4,
					hoverBackgroundColor: colors,
					hoverBorderColor: "#fff",
					hoverBorderWidth: 4,
					data: data
				}]
			};

		}

	},

	// once created
	created(){

		// define resource url
		var url = 'http://p0zzz.mocklab.io/calc/defaults/1';

		// test timeout
		// var url = 'https://httpstat.us/200?sleep=10000';

		// test failure
		// var url = 'https://httpstat.us/404';

		// test success, but without expected data
		// var url = 'https://httpstat.us/200';

		// config a quick timeout (2 secs)
		var config = {
			timeout: 2000
		};

		// query the api
		this.$http.get(url, config).then(function(data){

			// get the data obj
			data = data.body;

			// define valid amortization periods (terms)
			var terms = [15,20,30];

			// check amount
			if (typeof data.amount !== 'undefined') {
				var price = parseFloat(data.amount);
				if (!isNaN(price)) {
					this.price = this.toCurrency(price, 0);
				}
			}

			// check rate
			if (typeof data.rate !== 'undefined') {
				var rate = parseFloat(data.rate);
				if (!isNaN(rate) && rate <= 1 && rate >= 0) {
					this.rate = rate * 100;
				}
			}

			// check amortization period
			if (typeof data.amortization_period_years !== 'undefined') {
				var term = parseFloat(data.amortization_period_years);
				if (!isNaN(term) && terms.includes(term)) {
					this.term = term;
				}
			}

			// check down payment (this doesn't exist yet in the test api)
			if (typeof data.down_payment_percent !== 'undefined') {
				var upfront = parseFloat(data.down_payment_percent);
				if (!isNaN(upfront) && upfront <= 1 && upfront >= 0) {
					this.upfront = upfront * 100;
				}
			}

			// reveal the app
			this.reveal();

		}, function(data){

			/*
				if error, no worries, we already set default fallback
				values above, so let's just reveal the app. we could
				also set an error message here to display if desired
			*/
			this.reveal();

		});

	},

	watch: {

		// reset button text after save
		button: function(){

			// if button already correct, do nothing
			if (this.button == 'Save Settings') return;

			// else reset button text after a few seconds
			var that = this;
			setTimeout(function(){
				that.button = 'Save Settings';
			}, 2000);

		}
	}

});
