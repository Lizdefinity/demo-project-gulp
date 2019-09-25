// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const   sourcemaps      = require('gulp-sourcemaps'),
        sass            = require('gulp-sass'),
        concat          = require('gulp-concat'),
        uglify          = require('gulp-uglify'),
        postcss         = require('gulp-postcss'),
        autoprefixer    = require('autoprefixer'),
        cssnano         = require('cssnano'),
        zip             = require('gulp-zip'),
        del             = require('del'),
        imagemin        = require("gulp-imagemin"),
        newer           = require("newer"),
        browsersync     = require("browser-sync").create();

var replace = require('gulp-replace');

// define some variables
const folders  = {
    source: './src',
    destination: './dist',
    production: './prod'
}
// File paths
const files = {
    scssPath:   folders.source + '/scss/**/*.scss',
    jsPath:     folders.source + '/js/**/*.js',
    htmlPath:   folders.source + '/**/*.html',
    imagesPath: folders.source + '/images/**/*'
}
// Sass task: compiles the style.scss file into style.css
function scssTask(){
    return src(files.scssPath)
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass()) // compile SCSS to CSS
        .pipe(postcss([ autoprefixer(), cssnano() ])) // PostCSS plugins
        .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
        .pipe(dest(folders.destination + '/css')) // put final CSS in dist folder
        .pipe(browsersync.stream());
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask(){
    return src([
        files.jsPath
        //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
        ])
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(dest(folders.destination + '/js')) // put final CSS in dist folder
        .pipe(browsersync.stream());
}

// Optimize Images
function imagesTask() {
    return src(files.imagesPath)
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest(folders.destination + '/images'));
}

// Sass task: compiles the style.scss file into style.css
function htmlTask(){
    return src(files.htmlPath)
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(dest(folders.destination))
        .pipe(browsersync.stream());
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask(){
    watch([files.imagesPath, files.scssPath, files.jsPath, files.htmlPath],
    parallel(imagesTask, scssTask, jsTask, htmlTask));
    series(browserSyncReload)
}

// task: package to zip
function zipBuild(done){
    del(folders.production + 'production.zip'); // remove old zip file
    done();
    return src('dist/**/*')
		.pipe(zip('production.zip'))
		.pipe(dest(folders.production))
}
// task: clean without images
function cleanDev(done){
    del([
        folders.destination + '/**/*', // remove all old files
        '!' + folders.destination + 'images', // exclude images folder
        '!' + folders.destination + 'images/**/*' // exclude image files
    ]);
    done();
}

// BrowserSync
function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: folders.destination
        },
        port: 5000
    });
    done();
}
// BrowserSync Reload
function browserSyncReload(done) {
    browsersync.reload();
    done();
  }

// Export the default Gulp task so it can be run
// Runs the scss, js, html tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
    cleanDev,
    parallel(imagesTask, scssTask, jsTask, htmlTask, browserSync),
    watchTask
);
// Export the prod task so it can be run
exports.prod = series(
    zipBuild
);
