.PHONY: format test run clean

css-files:=$(wildcard app/*.css) $(wildcard app/*/*.css)
html-files:=$(wildcard *.html)
js-files:=$(wildcard app/*.mjs) $(wildcard app/*/*.mjs)
format-files=.format-css .format-js .format-html .format-cache

format: .git/hooks/pre-commit $(format-files)

.format-cache: node_modules/.updated .prettierrc $(css-files) $(js-files) $(html-files)
	./cache-bust update
	yarn --silent run prettier --write $(html-files)
	@touch $@

.format-css: node_modules/.updated .stylelintrc .prettierrc $(css-files)
	yarn --silent run stylelint --fix $(css-files)
	yarn --silent run prettier --write $(css-files)
	@touch $@

.format-js: node_modules/.updated .prettierrc $(js-files)
	yarn --silent run prettier --write $(js-files)
	@touch $@

.format-html: node_modules/.updated .prettierrc $(html-files)
	yarn --silent run prettier --write $(html-files)
	@touch $@

test: node_modules/.updated
	yarn --silent run stylelint $(css-files)
	yarn --silent run prettier --check $(js-files)
	yarn --silent run eslint $(js-files)
	./cache-bust check

.git/hooks/pre-commit: node_modules/.updated pre-commit
	cp pre-commit .git/hooks/pre-commit

node_modules/.updated: package.json
	yarn install
	@touch $@

run:
	python3 -m http.server --bind 127.0.0.1

clean:
	rm -rf node_modules $(format-files)
