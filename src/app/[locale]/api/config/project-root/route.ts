import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import config from '../../../../../../config.js';

// GET - 获取当前项目根目录
export async function GET() {
    try {
        const projectRoot = config.PROJECT_ROOT;
        const exists = fs.existsSync(projectRoot);

        return NextResponse.json({
            projectRoot,
            exists,
            isReadable: exists && fs.constants && (fs.accessSync(projectRoot, fs.constants.R_OK), true)
        });
    } catch (error) {
        console.error('Error getting project root:', error);
        return NextResponse.json({
            error: '获取项目根目录失败',
            projectRoot: config.PROJECT_ROOT,
            exists: false,
            isReadable: false
        }, { status: 500 });
    }
}

// POST - 设置新的项目根目录
export async function POST(request: NextRequest) {
    try {
        const { projectRoot } = await request.json();

        if (!projectRoot || typeof projectRoot !== 'string') {
            return NextResponse.json({
                error: '无效的路径参数'
            }, { status: 400 });
        }

        // 解析并验证路径
        const resolvedPath = path.resolve(projectRoot);

        // 检查路径是否存在
        if (!fs.existsSync(resolvedPath)) {
            return NextResponse.json({
                error: '路径不存在',
                path: resolvedPath
            }, { status: 400 });
        }

        // 检查是否为目录
        const stats = fs.statSync(resolvedPath);
        if (!stats.isDirectory()) {
            return NextResponse.json({
                error: '路径不是一个目录',
                path: resolvedPath
            }, { status: 400 });
        }

        // 检查是否可读
        try {
            fs.accessSync(resolvedPath, fs.constants.R_OK);
        } catch (accessError) {
            return NextResponse.json({
                error: '没有读取权限',
                path: resolvedPath
            }, { status: 403 });
        }

        // 设置新的项目根目录
        const success = config.setProjectRoot(resolvedPath);

        if (success) {
            console.log('Project root updated to:', resolvedPath);
            return NextResponse.json({
                success: true,
                projectRoot: config.PROJECT_ROOT,
                message: '项目根目录更新成功'
            });
        } else {
            return NextResponse.json({
                error: '设置项目根目录失败'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error setting project root:', error);
        return NextResponse.json({
            error: '设置项目根目录时发生错误'
        }, { status: 500 });
    }
} 