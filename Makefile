web-files := $(shell find . \( -name '*.css' -o -name '*.html' -o -name '*.mjs' \) -print)
biome     := NODE_NO_WARNINGS=1 npx --yes @biomejs/biome@2.5.7 check --config-path=.biome.json
py-files  := cache-bust
ruff      := uvx ruff@0.16.1
zizmor    := uvx zizmor@1.29.0

.PHONY: format
format: .git/hooks/pre-commit .format-web .format-py

.format-web: .biome.json $(web-files)
	$(biome) --write .biome.json $(web-files)
	./cache-bust update
	$(biome) --write index.html
	@touch $@

.format-py: .ruff.toml $(py-files)
	$(ruff) check --config .ruff.toml --fix-only --unsafe-fixes --exit-zero --show-fixes $(py-files)
	$(ruff) format --config .ruff.toml $(py-files)
	@touch $@

.PHONY: test
test:
	$(biome) $(web-files)
	$(ruff) check --config .ruff.toml $(py-files)
	$(ruff) format --config .ruff.toml --check $(py-files)
	$(zizmor) .github/workflows --strict-collection --pedantic --no-progress
	./cache-bust check

.PHONY: fix
fix:
	$(biome) --write --unsafe $(web-files)

.git/hooks/pre-commit: pre-commit
	cp pre-commit .git/hooks/pre-commit

.PHONY: run
run:
	python3 -m http.server --bind 127.0.0.1

.PHONY: clean
clean:
	rm -rf format-*
