import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface DirectoryItem {
    name: string;
    path: string;
    isDirectory: boolean;
    isReadable: boolean;
}

// 安全的目录列表 - 允许浏览的起始目录
const getSafeStartDirectories = () => {
    const homeDir = os.homedir();
    const safeDirectories = [
        { name: 'Home', path: homeDir },
        { name: 'Documents', path: path.join(homeDir, 'Documents') },
        { name: 'Desktop', path: path.join(homeDir, 'Desktop') },
        { name: 'Downloads', path: path.join(homeDir, 'Downloads') },
    ];

    // 只返回存在的目录
    return safeDirectories.filter(dir => {
        try {
            return fs.existsSync(dir.path) && fs.statSync(dir.path).isDirectory();
        } catch {
            return false;
        }
    });
};

// 检查路径是否在安全范围内
const isSafePath = (requestedPath: string): boolean => {
    try {
        const resolvedPath = path.resolve(requestedPath);
        const homeDir = os.homedir();

        // 只允许访问用户主目录及其子目录
        return resolvedPath.startsWith(homeDir) || resolvedPath === '/';
    } catch {
        return false;
    }
};

// 获取目录内容
const getDirectoryContents = (dirPath: string): DirectoryItem[] => {
    try {
        const items: DirectoryItem[] = [];
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            // 跳过隐藏文件和某些系统目录
            if (entry.name.startsWith('.') ||
                entry.name === 'node_modules' ||
                entry.name === 'Trash' ||
                entry.name === '$RECYCLE.BIN') {
                continue;
            }

            const itemPath = path.join(dirPath, entry.name);
            let isReadable = false;

            try {
                fs.accessSync(itemPath, fs.constants.R_OK);
                isReadable = true;
            } catch {
                isReadable = false;
            }

            // 只添加目录
            if (entry.isDirectory() && isReadable) {
                items.push({
                    name: entry.name,
                    path: itemPath,
                    isDirectory: true,
                    isReadable
                });
            }
        }

        // 按名称排序
        return items.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
    }
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedPath = searchParams.get('path');

        // 如果没有指定路径，返回安全的起始目录
        if (!requestedPath) {
            const safeDirectories = getSafeStartDirectories();
            return NextResponse.json({
                currentPath: '',
                items: safeDirectories.map(dir => ({
                    name: dir.name,
                    path: dir.path,
                    isDirectory: true,
                    isReadable: true
                })),
                parentPath: null
            });
        }

        // 验证路径安全性
        if (!isSafePath(requestedPath)) {
            return NextResponse.json({
                error: '访问被拒绝：路径不在允许范围内',
                currentPath: requestedPath
            }, { status: 403 });
        }

        const resolvedPath = path.resolve(requestedPath);

        // 检查路径是否存在
        if (!fs.existsSync(resolvedPath)) {
            return NextResponse.json({
                error: '路径不存在',
                currentPath: resolvedPath
            }, { status: 404 });
        }

        // 检查是否为目录
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
            return NextResponse.json({
                error: '路径不是一个目录',
                currentPath: resolvedPath
            }, { status: 400 });
        }

        // 获取目录内容
        const items = getDirectoryContents(resolvedPath);

        // 计算父目录路径
        const parentPath = path.dirname(resolvedPath);
        const hasParent = parentPath !== resolvedPath && isSafePath(parentPath);

        return NextResponse.json({
            currentPath: resolvedPath,
            items,
            parentPath: hasParent ? parentPath : null,
            breadcrumbs: generateBreadcrumbs(resolvedPath)
        });

    } catch (error) {
        console.error('Error browsing directories:', error);
        return NextResponse.json({
            error: '浏览目录时发生错误'
        }, { status: 500 });
    }
}

// 生成面包屑导航
const generateBreadcrumbs = (currentPath: string) => {
    const homeDir = os.homedir();
    const parts = currentPath.split(path.sep).filter(Boolean);
    const breadcrumbs = [];
    let currentBuildPath = '';

    // 添加根目录（Home）
    if (currentPath.startsWith(homeDir)) {
        breadcrumbs.push({ name: 'Home', path: homeDir });

        // 获取相对于home的路径部分
        const relativePath = path.relative(homeDir, currentPath);
        if (relativePath && relativePath !== '.') {
            const relativeParts = relativePath.split(path.sep).filter(Boolean);
            let buildPath = homeDir;

            for (const part of relativeParts) {
                buildPath = path.join(buildPath, part);
                breadcrumbs.push({ name: part, path: buildPath });
            }
        }
    } else {
        // 处理非home目录的情况
        breadcrumbs.push({ name: '/', path: '/' });
        currentBuildPath = '/';

        for (const part of parts) {
            currentBuildPath = path.join(currentBuildPath, part);
            breadcrumbs.push({ name: part, path: currentBuildPath });
        }
    }

    return breadcrumbs;
}; 