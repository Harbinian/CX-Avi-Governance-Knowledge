#!/usr/bin/env node
// Publish one committed main revision to each provider's documented main branch.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function git(argv, capture = false) {
  const result = spawnSync('git', argv, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });
  if (result.error) throw new Error(`无法启动 Git：${result.error.message}`);
  if (result.status !== 0) throw new Error(`Git 操作失败，退出码 ${result.status}；请核对上一条错误提示。`);
  return (result.stdout || '').trim();
}

try {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log('用法：node scripts/push-remotes.cjs [--dry-run]\n将本地 main 的已提交内容推送到 GitHub 和 Gitee 的 main。');
    process.exit(0);
  }
  if (args.length > 1 || (args.length === 1 && args[0] !== '--dry-run')) {
    throw new Error('仅支持 --dry-run 或 --help。');
  }
  if (git(['symbolic-ref', '--quiet', '--short', 'HEAD'], true) !== 'main') {
    throw new Error('主线双端发布须在本地 main 分支执行；其他分支请显式指定推送目标。');
  }
  const targets = [
    { remote: 'origin', branch: 'main' },
    { remote: 'gitee', branch: 'main' }
  ];
  for (const target of targets) {
    const urls = git(['remote', 'get-url', '--push', '--all', target.remote], true).split('\n').filter(Boolean);
    if (urls.length !== 1) throw new Error(`${target.remote} 必须只配置一个推送地址，请按 README 配置。`);
  }
  const commit = git(['rev-parse', 'HEAD'], true);
  const mode = args.includes('--dry-run') ? ['--dry-run'] : [];
  for (const target of targets) {
    console.log(`推送 ${commit.slice(0, 7)} → ${target.remote}/${target.branch}`);
    git(['push', ...mode, target.remote, `${commit}:refs/heads/${target.branch}`]);
  }
  console.log(mode.length ? '两端推送预检查通过；未更新远端。' : '两端推送完成，请核对远端分支及内容。');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
