//引入gulp工具
var gulp = require('gulp');

//引入gulp-webserver 模块
var server = require('gulp-webserver');

//引入css预处理模块
var  sass= require('gulp-sass');
//引入js 模块化工具gulp-webpack,  获取js文件模块 vinyl-named,js压缩模块
var named = require('vinyl-named');
var webpack = require('gulp-webpack');
var uglify = require('gulp-uglify');

var  minifyCSS  = require('gulp-minify-css');

//引入fs  url模块
var fs = require('fs');
var url = require('url');


//引入 rev revCollector 模块  提供控制版本号的功能
var rev = require('gulp-rev');
var revCollector= require('gulp-rev-collector');

//引入gulp-sequence模块
var sequence = require('gulp-sequence');
gulp.task('server',function () {
	 gulp.src('./')
	 .pipe(server({
		 host:'127.0.0.1',
		 port:80,
		 directoryListing:{
			 enable:true,
			 path:'./'
		 },
		 livereload:true,
		//  mock 数据
   middleware:function(req,res,next){
		 var urlObj =url.parse(req.url,true);   //req.url是整个url
		 switch(urlObj.pathname){
			 case '/api/orders':
			   res.setHeader('Comtent-Type','application/json');
			   fs.readFile('./mock/list.json',function(err,data){
					 if(err){
						 res.send('读取文件错误');
					 }
					 res.end(data);
				 });
				 return;
				 case '/api/users':
				 return;
				 case '/api/cart':
				 return;
		 }
		 next();
	 }
	 }));
})

//css预处理

var  cssFiles=[
	'./src/styles/app.scss'
];
gulp.task('scss',function () {
	gulp.src(cssFiles)
	.pipe(sass().on('error',sass.logError))
	.pipe(minifyCSS())
	.pipe(gulp.dest('./build/prd/styles/'))
})

//js 预处理和压缩
var jsFiles = [
	'./src/scripts/app.js'
];
gulp.task('packjs',function () {
	gulp.src(jsFiles)
	.pipe(named())
	.pipe(webpack({
		output:{
			filename:'[name].js'
		},
		module:{
			loaders:[
				{
					test:/\.js$/,
					loader:'imports?define=>false'
				}
			]
		}
	}))
	.pipe(uglify().on('error',function (err) {
		 console.log('\x07',err.linerNumber,err.message);
		 return this.end();
	}))
	.pipe(gulp.dest('./build/prd/scripts/'))
})

//版本号控制
var cssDistFile = [
	'./build/prd/styles/app.css'
];
var jsDistFile = [
	'./build/prd/scripts/app.js'
];
gulp.task('ver',function(){
	 gulp.src(cssDistFile)   //获取执行文件的位置
	 .pipe(rev())  //获取版本号
	 .pipe(gulp.dest('./build/prd/styles/'))
	 .pipe(rev.manifest())  
	 .pipe(gulp.dest('./build/ver/styles/'))
	 gulp.src(jsDistFile)
	.pipe(rev())
	.pipe(gulp.dest('./build/prd/scripts/'))
	.pipe(rev.manifest())
	.pipe(gulp.dest('./build/ver/scripts/'))
});
gulp.task('html',function(){
	gulp.src(['./build/ver/**/*','./build/*.*'])
	.pipe(revCollector())
	.pipe(gulp.dest('./build'));

});
gulp.task('min',sequence('copy-index','ver','html'));

//拷贝index.html到build文件夹
gulp.task('copy-index',function () {
   gulp.src('./index.html')
	 .pipe(gulp.dest('./build'));
})


//拷贝images 到build文件夹

gulp.task('copy-images',function () {
	 gulp.src('./images/**/*')
	 .pipe(gulp.dest('./build/images/'));
})

//侦测文件变化， 执行相应的任务
gulp.task('watch',function () {
	gulp.watch('./index.html',['copy-index']);
	gulp.watch('./images/**/*',['copy-images']);
	gulp.watch('./src/styles/*.{scss,css}',['scss','min']);
	gulp.watch('./src/scripts/*.js',['packjs','min'])
})


//配置default 任务，执行任务队列

gulp.task('default',['watch','server'],function () {
	console.log('任务队列执行完毕');
})

//  一次编译
// gulp.task('default',['copy-images','copy-index','server'],function () {
// 	console.log('任务队列执行完毕');
// })
