.PHONY: dev build deploy-worker deploy-pages deploy

# ローカル開発サーバー起動
dev:
	npx vite

# フロントエンドビルド
build:
	npx tsc --noEmit && npx vite build

# Cloudflare Worker デプロイ
deploy-worker:
	cd worker && npx wrangler deploy

# GitHub Pages デプロイ (push で自動デプロイ)
deploy-pages:
	git push

# 全部デプロイ (Worker + Pages)
deploy: deploy-worker deploy-pages
