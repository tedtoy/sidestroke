
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
              'lib/jquery1.10.2.min.js',
              'lib/underscore-min.js',  
              'lib/backbone-min.js',  
              'lib/easings.js',  
              'src/inputhandler.js',  
              'src/pipelinedirector.js',  
        dest: 'dist/sidestroke.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src:  'dist/sidestroke.js',
        dest: 'dist/sidestroke-min.js'
      }
    }
  });

  // Load the plugins:
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['concat','uglify']);

};

