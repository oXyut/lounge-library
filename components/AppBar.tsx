import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';


// 色のグラデーションをつけるための関数
function linearGradient(color1: string, color2: string, angle: number) {
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
}

export default function ButtonAppBar() {
    return (
        <>
    <Box sx={{ flexGrow: 1, paddingTop:1, paddingBottom:1}}>
      <AppBar
        position="static"
        sx={{
          background: linearGradient('#004d40', '#009688', 90),
        }}
        >
        <Toolbar>
            <Typography variant="h5" component="h1">ラウンジ6F貸出管理システム</Typography>
        </Toolbar>
      </AppBar>
    </Box>
    </>
  );
}