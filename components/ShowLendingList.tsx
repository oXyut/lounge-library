import { useContext, useState } from 'react';
import { Typography, LinearProgress } from '@mui/material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Tabs, Tab, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

import { LendingListContext } from 'pages/index';
import dayjs from 'dayjs';

export default function ShowLendingList () {
  const { lendingList, isGettingNow, fetchLendingList } = useContext(LendingListContext)
  const [tabValue, setTabValue] = useState<number>(0)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  return (
    <>
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
      >
        <Tab label={<Typography variant='h6'>貸出中</Typography>} {...{id: "tab-rent"}}/>
        <Tab label={<Typography variant='h6'>返却済</Typography>} {...{id: "tab-return"}}/>
      </Tabs>
    </Box>
    <Box
      sx={{
        p: 3,
      }}
    >
    { tabValue === 0 ? (
      <Typography variant="h5" component="h2" gutterBottom sx={{ textDecoration: 'underline' }}>貸出中一覧</Typography>
    ) : (
      <Typography variant="h5" component="h2" gutterBottom sx={{ textDecoration: 'underline' }}>一ヶ月以内に返却済</Typography>
    )}
    {
          <>
          {isGettingNow && <LinearProgress />}
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>{ tabValue == 0 ? "貸出日" : "返却日" }</TableCell>
                  { tabValue == 0 && <TableCell>返却期限</TableCell>}
                  <TableCell>学籍番号</TableCell>
                  <TableCell>タイトル</TableCell>
                  <TableCell>著者</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lendingList.filter(row => row.isLendingNow === (tabValue === 0)).map((row) => (
                  <TableRow
                  key={row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    { tabValue == 0 ? (
                      <TableCell >{dayjs.unix(row.lendingDatetime/1000).format("YY/MM/DD")}</TableCell>
                    ) : (
                      <TableCell >{dayjs.unix(row.returnedDatetime/1000).format("YY/MM/DD")}</TableCell>
                    )}
                    { tabValue == 0 &&(
                      <TableCell style={row.lendingDatetime/1000 > row.lendingDatetime/1000 + 1209600 ? {color:"red"}:{}}>{dayjs.unix(row.lendingDatetime/1000 + 1209600).format("YY/MM/DD")}</TableCell>
                    )}
                    <TableCell >{row.studentId}</TableCell>
                    <TableCell >{row.bookTitle}</TableCell>
                    <TableCell >{row.bookAuthors.join(", ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </>
    }
      <Button onClick={fetchLendingList}>
        <ReplayIcon sx={{ mr: 1 }} />
        更新する
      </Button>
    </Box>
    </>
  )
}