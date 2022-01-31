import {
  Button,
  ButtonProps,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  styled,
  TextField,
} from "@mui/material";
import { blue, purple } from "@mui/material/colors";
import React, { useEffect, useState } from "react";
import { Wheel } from "react-custom-roulette";
import { WheelData } from "react-custom-roulette/dist/components/Wheel/types";
import "./App.css";
import DeleteIcon from "@mui/icons-material/Delete";
import { useLocation, useNavigate } from "react-router";
import QueryString from "qs";
import { z } from "zod";
import { makeJsonEncoder, makeJsonDecoder } from "@urlpack/json";

const StartButton = styled(Button)<ButtonProps>(({ theme }) => ({
  marginTop: "20px",
  width: "100%",
  fontSize: 20,
  color: theme.palette.getContrastText(purple[500]),
  backgroundColor: purple[500],
  "&:hover": {
    backgroundColor: "#fff",
    color: purple[500],
  },
}));

const InitButton = styled(Button)<ButtonProps>(({ theme }) => ({
  width: "100%",
  height: "45px",
  fontSize: 20,
  color: theme.palette.getContrastText(blue[500]),
  backgroundColor: blue[500],
  "&:hover": {
    backgroundColor: "#fff",
    color: blue[500],
  },
}));

const queryStringZod = z
  .object({
    data: z.string().optional(),
  })
  .optional();

const wheelDatasZod = z.array(
  z.object({
    option: z.string(),
  })
);

const jsonEncoder = makeJsonEncoder();
const jsonDecoder = makeJsonDecoder();

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [addValueState, setAddValueState] = useState("");
  const [data, setData] = useState<WheelData[]>([]);

  const [isResultShow, setIsResultShow] = useState<boolean>(false);

  useEffect(() => {
    const search = QueryString.parse(location.search, {
      ignoreQueryPrefix: true,
    });

    const searchObj = queryStringZod.parse(search);
    if (searchObj?.data) {
      const decodeObj = jsonDecoder.decode(searchObj.data);
      const wheelDatas = wheelDatasZod.parse(decodeObj);

      setData(wheelDatas);
    }
  }, []);

  const handleSpinClick = () => {
    if (mustSpin || data.length < 2) {
      return;
    }
    const newPrizeNumber = Math.floor(Math.random() * data.length);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
  };

  const refreshQueryString = (newData: WheelData[]) => {
    const encodeString = jsonEncoder.encode(newData);
    if (encodeString.length > 2000) {
      alert("너무 많은 데이터");
      return;
    }
    navigate(`?data=${encodeString}`);
  };

  const handleInitButton = () => {
    if (mustSpin) {
      return;
    }

    setData([]);
    refreshQueryString([]);
    setPrizeNumber(0);
  };

  return (
    <>
      <div className="roulette-layout">
        <div style={{ textAlign: "center" }}>
          <h1>룰렛</h1>
          <Wheel
            mustStartSpinning={mustSpin}
            data={
              data.length > 0
                ? data
                : new Array(4).fill({
                    option: "항목을 추가하세요",
                  })
            }
            prizeNumber={prizeNumber}
            outerBorderWidth={2}
            innerBorderWidth={2}
            radiusLineWidth={3}
            innerRadius={0}
            backgroundColors={["#F99533", "#24CA69", "#46AEFF", "#9145B7"]}
            fontSize={20}
            onStopSpinning={() => {
              setMustSpin(false);
              setIsResultShow(true);
              setTimeout(() => {
                setIsResultShow(false);
              }, 1500);
            }}
          ></Wheel>
          <StartButton
            variant="outlined"
            size="large"
            onClick={handleSpinClick}
          >
            시작
          </StartButton>
        </div>
        <div
          style={{
            width: "100px",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
          }}
        >
          <div
            style={{
              height: "200px",
              display: "flex",
              justifyContent: "center",
              textAlign: "center",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                width: "100%",
              }}
            >
              <InitButton onClick={handleInitButton}>초기화</InitButton>
            </span>
          </div>
          <div
            style={{
              width: "250px",
            }}
          >
            <TextField
              id="add-text"
              label="항목 추가"
              variant="standard"
              InputProps={{ style: { fontSize: 20 } }}
              InputLabelProps={{ style: { fontSize: 20 } }}
              style={{
                width: "100%",
              }}
              value={addValueState}
              onChange={(event) => {
                setAddValueState(event.target.value);
              }}
              onKeyPress={(event) => {
                if (mustSpin || addValueState.length < 1) return;
                if (event.key === "Enter") {
                  const newData = [
                    ...data,
                    {
                      option: addValueState,
                    },
                  ];
                  setData(newData);
                  setAddValueState("");
                  refreshQueryString(newData);
                }
              }}
            />
          </div>
          <div>
            <List>
              {data.map((_data, idx) => {
                return (
                  <ListItem
                    key={idx}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          if (mustSpin) return;

                          const tmpData = [...data];
                          tmpData.splice(idx, 1);
                          setData(tmpData);

                          refreshQueryString(tmpData);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <Chip
                      label={idx + 1}
                      style={{
                        marginRight: "5px",
                      }}
                    />
                    <ListItemText primary={_data.option} />
                  </ListItem>
                );
              })}
            </List>
          </div>
        </div>
      </div>
      <Dialog
        open={isResultShow}
        onClose={() => {
          setIsResultShow(false);
        }}
      >
        <DialogContent
          style={{
            display: "flex",
            width: "500px",
            height: "200px",
            justifyContent: "center",
            textAlign: "center",
            flexDirection: "column",
          }}
        >
          <span style={{ fontSize: "40px" }}>
            {data[prizeNumber] ? data[prizeNumber].option : ""}
          </span>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
