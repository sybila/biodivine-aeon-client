
bundle:
	inline-assets --htmlmin --cssmin --jsmin index.html index.bundle.html

dev-bundle:
	inline-assets index.html index.dev.bundle.html