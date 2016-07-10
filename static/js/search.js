var lunrIndex,
    pagesIndex;

// Initialize lunrjs using our generated index file
function initLunr() {
    // First retrieve the index file
    $.getJSON("/js/index.json")
        .done(function(index) {
            pagesIndex = index;

            // Set up lunrjs by declaring the fields we use
            // Also provide their boost level for the ranking
            lunrIndex = lunr(function() {
                this.field("title", {
                    boost: 10
                });
                this.field("tags", {
                    boost: 5
                });
                this.field("content");

                // ref is the result item identifier (I chose the page URL)
                this.ref("href");
            });

            // Feed lunr with each file and let lunr actually index them
            pagesIndex.forEach(function(page) {
                lunrIndex.add(page);
            });
        })
        .fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.error("Error loading index file:", err);
        });
}

// Nothing crazy here, just hook up a listener on the input field
function initUI() {
    $("#search").keyup(function() {
        // Only trigger a search when 2 chars. at least have been provided
        var query = $(this).val();
        if (query.length <= 2) {
            return;
        }

        var results = search(query);

        renderResults(results);
    });
}

/**
 * Trigger a search in lunr and transform the result
 *
 * @param  {String} query
 * @return {Array}  results
 */
function search(query) {
    // Find the item in our index corresponding to the lunr one to have more info
    // Lunr result: 
    //  {ref: "/section/page1", score: 0.2725657778206127}
    // Our result:
    //  {title:"Page1", href:"/section/page1", ...}
    return lunrIndex.search(query).map(function(result) {
        return pagesIndex.filter(function(page) {
            return page.href === result.ref;
        })[0];
    });
}

/**
 * Display the 10 first results
 *
 * @param  {Array} results to display
 */
function renderResults(results) {
    if (!results.length) {
        return;
    }

/**
 *
 * <div class="card">
 *   <a href="{{ .Permalink }}"><img class="card-img-top img-fluid {{ .Section }}" src="{{ .Params.thumbnail }}" alt="{{ .Params.ThumbnailAlt }}"></a>
 *   <div class="card-block">
 *     <h4 class="card-title"><a href="{{ .Permalink }}">{{ .Title }}</a></h4>
 *     <p class="card-text">{{ .Summary }}</p>
 *     <p class="card-text">
 *       <small class="text-muted">
 *         Posted in <a href="/{{ .Section }}">{{ .Section }}</a> <relative-time datetime="{{ .Date }}">{{ .Date }}</relative-time>
 *       </small>
 *     </p>
 *   </div>
 * </div>
 * 
 */

    var wrapper = $(".card-columns");
    wrapper.empty();

    // Only show the ten first results
    results.forEach(function(result) {
      var result = '<div class="card">'
            + '<a href="'+ result.href +'"><img class="card-img-top img-fluid '+ result.section +'" src="'+ result.thumbnail + '"></a>'
            + '<div class="card-block">'
              + '<h4 class="card-title"><a href="'+ result.href +'">'+ result.title +'</a></h4>'
              + '<p class="card-text">'+ result.content.substring(0, 30) +'</p>'
              + '<p class="card-text">'
                + '<small class="text-muted">'
                + 'Posted in <a href="/'+ result.section +'">'+ result.section +'</a> <relative-time datetime="'+ result.date +'">'+ result.date +'</relative-time>'
                + '</small>'
              + '</p>'
            + '</div>'
          + '</div>'

      wrapper.append(result);
    });
}

// Let's get started
initLunr();

$(document).ready(function() {
    initUI();
});
