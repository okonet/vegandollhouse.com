var yaml = require('js-yaml');
var S = require("string");

var CONTENT_PATH_PREFIX = "content";

module.exports = function(grunt) {
    grunt.registerTask("lunr-index", function() {
        grunt.log.writeln("Build pages index");

        var indexPages = function() {
            var pagesIndex = [];
            grunt.file.recurse(CONTENT_PATH_PREFIX, function(abspath, rootdir, subdir, filename) {
                if (filename != "search.html") {
                  grunt.verbose.writeln("Parse file:", abspath);
                  pagesIndex.push(processFile(abspath, filename));
                }
            });

            return pagesIndex;
        };

        var processFile = function(abspath, filename) {
            var pageIndex;

            if (S(filename).endsWith(".html")) {
                pageIndex = processHTMLFile(abspath, filename);
            } else {
                pageIndex = processMDFile(abspath, filename);
            }

            return pageIndex;
        };

        var processHTMLFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            var href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(".html").s;

            content = content.split("---");
            var frontMatter;
            try {
                frontMatter = yaml.load(content[1].trim());
            } catch (e) {
                conzole.failed(e.message);
            }

            // Build Lunr index for this page
            return {
                title: frontMatter.title,
                tags: frontMatter.tags,
                section: frontMatter.section,
                thumbnail: frontMatter.thumbnail,
                date: frontMatter.date,
                description: frontMatter.description,
                href: href,
                content: S(content[2]).trim().stripTags().stripPunctuation().s
            };
        };

        var processMDFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            // First separate the Front Matter from the content and parse it
            content = content.split("---");
            var frontMatter;
            try {
                frontMatter = yaml.load(content[1].trim());
            } catch (e) {
                conzole.failed(e.message);
            }

            var href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(".md").s;
            // href for index.md files stops at the folder name
            if (filename === "index.md") {
                href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(filename).s;
            }

            // Build Lunr index for this page
            return {
                title: frontMatter.title,
                tags: frontMatter.tags,
                section: frontMatter.section,
                thumbnail: frontMatter.thumbnail,
                date: frontMatter.date,
                description: frontMatter.description,
                href: href,
                content: S(content[2]).trim().stripTags().stripPunctuation().s
            };
        };

        grunt.file.write("static/js/index.json", JSON.stringify(indexPages()));
        grunt.log.ok("Index built");
    });

    grunt.registerTask('default', ['lunr-index']);
};
