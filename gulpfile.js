'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del', 'browser-sync', 'proxy']
    }),
    through = require('through2'),
    path = require('path');

function modify () {
    function transform(file, enc, callback) {
        if (!file.isBuffer()) {
            this.push(file);
            callback();
            return;
        }
        var funcName = path.basename(file.path, '.js');
        var from = 'function template(locals) {';
        var to = 'templates.' + funcName + ' = function (locals) {';
        var contents = file.contents.toString().replace(from, to);
        file.contents = new Buffer(contents);
        this.push(file);
        callback();
    }

    return through.obj(transform);
};

gulp.task('process-js', function() {
    return gulp.src(['src/modules/**/module.js', 'src/modules/**/*.js'])
        // .pipe($.debug({verbose: true}))
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'))
        .pipe($.sourcemaps.init())
        .pipe($.concat('chpc-min.js'))
        .pipe($.ngAnnotate())
        .pipe($.uglify())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('dist/js'))
        .pipe($.size({title: "JS"}));;
});

gulp.task('process-css', function() {
    return gulp.src(['src/modules/**/*.css','src/modules/**/*.styl'])
        // .pipe($.debug({verbose: true}))
        .pipe($.stylus())
        .pipe($.concat('chpc-min.css'))
        .pipe($.autoprefixer())
        .pipe($.csso())
        .pipe(gulp.dest('dist/css'))
        .pipe($.size({title: "CSS"}));;
});

gulp.task('partials', function () {
  return gulp.src('src/modules/**/*.html')
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.ngHtml2js({
      moduleName: 'chpc'
    }))
    .pipe($.concat('chpc-tpl.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('dist/js'))
    .pipe($.size({title: "Partials"}));
});

gulp.task('html', ['process-css', 'process-js', 'partials', 'json'], function () {
    return gulp.src('src/index.html')
        .pipe($.minifyHtml({
          empty: true,
          spare: true,
          quotes: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('json', function () {
    return gulp.src('src/**/*.json')
        .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
  return gulp.src('src/assets/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/assets/images'))
    .pipe($.size({title: "Images"}));
});

gulp.task('bower-fonts', function () {
  return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({title: "Bower fonts"}));
});

gulp.task('bower-css', function () {
  return gulp.src($.mainBowerFiles())
    // .pipe($.debug({verbose: true}))
    .pipe($.filter('**/*.css'))
    // .pipe($.flatten())
    .pipe($.autoprefixer())
    .pipe($.csso())
    .pipe($.concat('vendors.css'))
    // .pipe($.rev())
    .pipe(gulp.dest('dist/css'))
    .pipe($.size({title: "Bower css"}));
});

gulp.task('bower-js', function () {
  return gulp.src($.mainBowerFiles())
    .pipe($.filter('**/*.js'))
    // .pipe($.debug({verbose: true}))
    // .pipe($.flatten())
    .pipe($.concat('vendors.js'))
    .pipe($.uglify({preserveComments: $.uglifySaveLicense}))
    // .pipe($.rev())
    .pipe($.size({title: "Bower js"}))
    .pipe(gulp.dest('dist/js'))
    // .pipe(assetMapping = $.rev.manifest())
    ;
});

gulp.task('clean', function (cb) {
    $.del(['dist'], cb);
});

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('build', ['html', 'images', 'bower-fonts', 'bower-js', 'bower-css']);

gulp.task('help', $.taskListing);

gulp.task('watch', ['build'] ,function () {
  gulp.watch('src/**/*', ['html', $.browserSync.reload]);
  gulp.watch('src/assets/images/**/*', ['images', $.browserSync.reload]);
  gulp.watch('bower.json', ['bower-js', 'bower-css', 'bower-fonts', $.browserSync.reload]);
});

gulp.task('serve', ['watch'], function() {
    $.browserSync({
        server: {
            baseDir: "./dist"
        }
    });
});
