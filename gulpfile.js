'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del', 'browser-sync', 'proxy']
    }),
    through = require('through2'),
    path = require('path'),
    quickLogin = '';

function fillQuickLogin(user, passwd) {
    quickLogin += '<i class="fa fa-child clickable green" ng-click="login(USER, PASS)"></i>'
        .replace(/USER/g, "'" + user + "'")
        .replace(/PASS/g, "'" + passwd + "'");
}

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

gulp.task('dev', function() {
    quickLogin = '';
    fillQuickLogin('user001', 'user001001');
    fillQuickLogin('user002', 'user002002');
    fillQuickLogin('user003', 'user003003');
});

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
        .pipe($.size({title: "JS"}));
});

gulp.task('process-css', function() {
    return gulp.src(['src/modules/**/*.css','src/modules/**/*.styl'])
        // .pipe($.debug({verbose: true}))
        .pipe($.stylus())
        .pipe($.concat('chpc-min.css'))
        .pipe($.autoprefixer())
        .pipe($.csso())
        .pipe(gulp.dest('dist/css'))
        .pipe($.size({title: "CSS"}));
});

gulp.task('partials', function () {
  return gulp.src('src/modules/**/*.html')
    .pipe($.template({ quickLogin: quickLogin }))
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

gulp.task('html', ['process-css', 'process-js', 'partials', 'json', 'vtkweb-js'], function () {
    return gulp.src('src/index.html')
        .pipe($.minifyHtml({
          empty: true,
          spare: true,
          quotes: true
        }))
        .pipe(gulp.dest('dist'));
});


gulp.task('jade', function() {
  return gulp.src('./src/**/*.jade')
    .pipe($.jade({client: true}))
    .pipe(modify())
    .pipe($.header('var templates = {}, jade = { escape: function(obj) { return obj; }};'))
    .pipe($.concat('jade-templates.js'))
    .pipe(gulp.dest('./dist/js'))
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

gulp.task('vtkweb-js', function () {
  return gulp.src(['src/assets/**/vtkweb-all.min.js', 'src/assets/**/*.js'])
    .pipe($.concat('vtk-web.js'))
    .pipe($.replace(/vtk-icon-bookmark-empty/g, 'fa-bookmark-o'))
    .pipe($.replace(/vtk-icon-bookmark/g, 'fa fa-bookmark'))
    .pipe($.replace(/'-empty'/g, "'-o'"))
    .pipe($.replace(/<div class="pv-collapse-title pv-collapsable-action clickable"><span class="vtk-icon-plus-circled">NAME<\/span><\/div><div class="pv-no-collapse-title pv-collapsable-action clickable"><span class="vtk-icon-minus-circled pv-absolute-left">NAME<\/span>/g,
          '<div class="pv-collapse-title pv-collapsable-action clickable"><span class="fa fa-fw fa-plus-circle"></span>NAME</div><div class="pv-no-collapse-title pv-collapsable-action clickable"><span class="pv-absolute-left"><i class="fa fa-fw fa-minus-circle"></i>NAME</span>'))
    .pipe($.replace(/-circled/g, '-circle'))
    .pipe($.replace(/vtk-icon-cancel/g, 'fa fa-close'))
    .pipe($.replace(/vtk-icon-cancel-circle/g, 'fa fa-remove'))
    .pipe($.replace(/vtk-icon-doc/g, 'fa fa-file-o'))
    .pipe($.replace(/vtk-icon-doc-text/g, 'fa fa-file-text-o'))
    .pipe($.replace(/vtk-icon-folder-empty/g, 'fa fa-folder-o'))
    .pipe($.replace(/vtk-icon-help-circle/g, 'fa fa-info-circle'))
    .pipe($.replace(/vtk-icon-minus-circle/g, 'fa fa-minus-circle'))
    .pipe($.replace(/vtk-icon-ok/g, 'fa fa-check'))
    .pipe($.replace(/vtk-icon-ok-circle/g, 'fa fa-check-circle-o'))
    .pipe($.replace(/vtk-icon-play/g, 'fa fa-play'))
    .pipe($.replace(/vtk-icon-plus/g, 'fa fa-plus'))
    .pipe($.replace(/vtk-icon-plus-circle/g, 'fa fa-plus-circle'))
    .pipe($.replace(/vtk-icon-resize-horizontal-1/g, 'fa fa-arrows-h'))
    .pipe($.replace(/vtk-icon-tools/g, 'fa fa-plug'))
    .pipe($.replace(/vtk-icon-trash/g, 'fa fa-trash-o'))
    .pipe($.uglify({preserveComments: $.uglifySaveLicense}))
    .pipe(gulp.dest('dist/js'))
    ;
});

gulp.task('clean', function (cb) {
    return $.del(['dist'], cb);
});

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('build', ['jade', 'html', 'images', 'bower-fonts', 'bower-js', 'bower-css']);

gulp.task('build-dev', ['dev', 'build']);

gulp.task('help', $.taskListing);

gulp.task('watch', ['build'] ,function () {
  gulp.watch('src/**/*', ['jade','html', $.browserSync.reload]);
  gulp.watch('src/assets/images/**/*', ['images', $.browserSync.reload]);
  gulp.watch('bower.json', ['bower-js', 'bower-css', 'bower-fonts', $.browserSync.reload]);
});

gulp.task('watch-dev', ['dev', 'build'] ,function () {
  gulp.watch('src/**/*', ['jade', 'html', $.browserSync.reload]);
  gulp.watch('src/assets/images/**/*', ['images', $.browserSync.reload]);
  gulp.watch('bower.json', ['bower-js', 'bower-css', 'bower-fonts', $.browserSync.reload]);
});

gulp.task('serve', ['watch'], function() {
    $.browserSync({
        server: {
            baseDir: "./dist"
        },
        notify: false
    });
});

gulp.task('serve-dev', ['watch-dev'], function() {
    $.browserSync({
        server: {
            baseDir: "./dist"
        },
        notify: false
    });
});
