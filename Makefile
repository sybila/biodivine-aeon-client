
# --jsmin currently breaks some of our scripts so it is disabled
bundle:
	inline-assets --htmlmin --cssmin index.html index.bundle.html

dev-bundle:
	inline-assets index.html index.dev.bundle.html